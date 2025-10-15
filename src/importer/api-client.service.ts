import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { TransformedTicket } from './data-transformer.service';
import { SentryService } from '../common/services/sentry.service';

export interface ApiRequest {
    Timestamp: string;
    Seq: string;
    Payload: {
        Tickets: TransformedTicket[];
    };
    _storedAt?: string;
    _headers?: any;
    _response?: any;
    _error?: any;
}

export interface ApiResponse {
    Timestamp: string;
    Seq: string;
    ErrorCode: number;
    ErrorMessage: string;
}

@Injectable()
export class ApiClientService {
    private readonly logger = new Logger(ApiClientService.name);
    private readonly baseUrl: string;
    private readonly operatorPwd: string;
    private readonly operatorKey: string;
    private readonly maxRetryAttempts: number;
    private readonly retryBaseDelay: number;
    private readonly storedRequests: ApiRequest[] = [];

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly sentryService: SentryService,
    ) {
        this.baseUrl = this.configService.get<string>('api.baseUrl', 'https://api.example.com');
        this.operatorPwd = this.configService.get<string>('api.operatorPwd', '');
        this.operatorKey = this.configService.get<string>('api.operatorKey', '');
        this.maxRetryAttempts = this.configService.get<number>('importer.maxRetryAttempts', 5);
        this.retryBaseDelay = this.configService.get<number>('importer.retryBaseDelayMs', 1000);
    }

    async sendTickets(tickets: TransformedTicket[]): Promise<void> {
        const request: ApiRequest = {
            Timestamp: new Date().toISOString(),
            Seq: this.generateSequenceId(),
            Payload: {
                Tickets: tickets,
            },
        };

        await this.sendWithRetry(request);
    }

    private async sendWithRetry(request: ApiRequest, attempt: number = 1): Promise<void> {
        try {
            this.logger.log(`Attempting to send ${request.Payload.Tickets.length} tickets (attempt ${attempt})`);

            // Add breadcrumb for Sentry tracking
            this.sentryService.addBreadcrumb({
                message: `API request attempt ${attempt} for ${request.Payload.Tickets.length} tickets`,
                category: 'api-request',
                level: 'info',
                data: {
                    sequenceId: request.Seq,
                    attempt: attempt,
                    ticketCount: request.Payload.Tickets.length,
                },
            });

            const response = await this.makeRequest(request);

            if (response.ErrorCode === 0) {
                this.logger.log(`Successfully sent tickets: ${response.ErrorMessage}`);
                return;
            } else {
                throw new Error(`API Error: ${response.ErrorMessage} (Code: ${response.ErrorCode})`);
            }
        } catch (error) {
            this.logger.error(`Attempt ${attempt} failed:`, error);

            // Capture error with Sentry for monitoring
            this.sentryService.captureException(error, {
                method: 'sendWithRetry',
                attempt: attempt,
                maxRetryAttempts: this.maxRetryAttempts,
                ticketCount: request.Payload.Tickets.length,
                sequenceId: request.Seq,
                baseUrl: this.baseUrl,
                isMaxRetryReached: attempt >= this.maxRetryAttempts,
            });

            if (attempt >= this.maxRetryAttempts) {
                this.logger.error(`Max retry attempts (${this.maxRetryAttempts}) reached. Giving up.`);

                // Send additional Sentry message for max retry failure
                this.sentryService.captureMessage(`API request failed after ${this.maxRetryAttempts} attempts`, 'error', {
                    method: 'sendWithRetry',
                    sequenceId: request.Seq,
                    ticketCount: request.Payload.Tickets.length,
                    baseUrl: this.baseUrl,
                    finalAttempt: attempt,
                });

                throw error;
            }

            // Exponential backoff
            const delay = this.retryBaseDelay * Math.pow(2, attempt - 1);
            this.logger.log(`Retrying in ${delay}ms...`);

            await this.delay(delay);
            await this.sendWithRetry(request, attempt + 1);
        }
    }

    private async makeRequest(request: ApiRequest): Promise<ApiResponse> {
        const body = JSON.stringify(request);
        // Calculate operator-sign using the formula: MD5(body + operatorKey)
        const operatorSign = crypto
            .createHash('md5')
            .update(body + this.operatorKey)
            .digest('hex');

        const headers = {
            'Content-Type': 'application/json',
            'operator-pwd': this.operatorPwd,
            'operator-sign': operatorSign,
        };

        const apiEndpoint = `${this.baseUrl}/api/OperatorApi/ImportExtTicket`;
        this.logger.log(`Sending request to ${apiEndpoint}`);
        this.logger.debug(`Request headers:`, headers);
        this.logger.debug(`Request body:`, body);

        try {
            this.logger.log(`Making HTTP POST request to: ${apiEndpoint}`);

            const response = await firstValueFrom(
                this.httpService.post(apiEndpoint, body, {
                    headers,
                    timeout: 30000, // 30 second timeout
                }),
            );

            this.logger.log(`API response received: ${response.status} ${response.statusText}`);
            this.logger.debug(`Response data:`, response.data);

            // Validate response structure
            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Invalid response format from API');
            }

            // Store successful request for reference
            this.storedRequests.push({
                ...request,
                _storedAt: new Date().toISOString(),
                _headers: headers,
                _response: response.data,
            });

            this.logger.log(`Request sent successfully. Total stored requests: ${this.storedRequests.length}`);

            // Return the API response
            return response.data as ApiResponse;
        } catch (error) {
            this.logger.error(`HTTP request failed:`, error);

            // Enhanced error information
            const errorInfo = {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                code: error.code,
                timeout: error.timeout,
            };

            this.logger.error(`Error details:`, errorInfo);

            // Store failed request for debugging
            this.storedRequests.push({
                ...request,
                _storedAt: new Date().toISOString(),
                _headers: headers,
                _error: errorInfo,
            });

            // Create a more descriptive error for retry logic
            const enhancedError = new Error(`API request failed: ${error.message} (Status: ${error.response?.status || 'Unknown'})`);
            enhancedError.stack = error.stack;

            // Re-throw the enhanced error to be handled by the retry logic
            throw enhancedError;
        }
    }

    private generateSequenceId(): string {
        return `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Get all stored requests from memory
     */
    getStoredRequests(): ApiRequest[] {
        return this.storedRequests;
    }

    /**
     * Get the count of stored requests
     */
    getStoredRequestsCount(): number {
        return this.storedRequests.length;
    }

    /**
     * Clear all stored requests from memory
     */
    clearStoredRequests(): void {
        this.storedRequests.length = 0;
        this.logger.log('All stored requests cleared from memory');
    }

    /**
     * Get request statistics for monitoring
     */
    getRequestStatistics(): {
        total: number;
        successful: number;
        failed: number;
        successRate: number;
    } {
        const total = this.storedRequests.length;
        const successful = this.storedRequests.filter((req) => req._response && !req._error).length;
        const failed = this.storedRequests.filter((req) => req._error).length;
        const successRate = total > 0 ? (successful / total) * 100 : 0;

        return {
            total,
            successful,
            failed,
            successRate: Math.round(successRate * 100) / 100,
        };
    }
}
