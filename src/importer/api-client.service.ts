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
    private readonly operatorSign: string;
    private readonly maxRetryAttempts: number;
    private readonly retryBaseDelay: number;
    private readonly storedRequests: ApiRequest[] = [];

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly sentryService: SentryService,
    ) {
        this.baseUrl = this.configService.get<string>('API_BASE_URL', 'https://api.example.com');
        this.operatorPwd = this.configService.get<string>('API_OPERATOR_PWD', '');
        this.operatorSign = this.configService.get<string>('API_OPERATOR_SIGN', '');
        this.maxRetryAttempts = parseInt(this.configService.get<string>('MAX_RETRY_ATTEMPTS', '5'));
        this.retryBaseDelay = parseInt(this.configService.get<string>('RETRY_BASE_DELAY_MS', '1000'));
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
        const bodyMd5 = crypto.createHash('md5').update(body).digest('hex');

        const headers = {
            'Content-Type': 'application/json',
            'operator-pwd': this.operatorPwd,
            'operator-sign': bodyMd5,
        };

        this.logger.log(`Storing request in memory instead of sending to ${this.baseUrl}/inbox`);
        this.logger.debug(`Request headers:`, headers);
        this.logger.debug(`Request body:`, body);

        // Store request in memory instead of making HTTP call
        this.storedRequests.push({
            ...request,
            _storedAt: new Date().toISOString(),
            _headers: headers,
        });

        this.logger.log(`Request stored in memory. Total stored requests: ${this.storedRequests.length}`);

        // Return a mock successful response
        return {
            Timestamp: new Date().toISOString(),
            Seq: request.Seq,
            ErrorCode: 0,
            ErrorMessage: 'Success (stored in memory)',
        };
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
}
