import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { TransformedTicket } from './data-transformer.service';
import { SentryService } from '../common/services/sentry.service';
import { ApiLogService } from '../database/api-log.service';

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
        private readonly apiLogService: ApiLogService,
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

    private async sendWithRetry(request: ApiRequest, attempt = 1): Promise<void> {
        const requestTimestamp = request.Timestamp;
        let responseTimestamp: string;

        try {
            this.logAttempt(request, attempt);
            this.addSentryBreadcrumb(request, attempt);

            const response = await this.makeRequest(request);
            responseTimestamp = new Date().toISOString();

            if (response.ErrorCode === 0) {
                this.logger.log(`Successfully sent tickets: ${response.ErrorMessage}`);

                // Log successful request
                await this.apiLogService.logSuccessRequest(request.Seq, requestTimestamp, responseTimestamp, request, response, {
                    attempt: attempt,
                    maxRetryAttempts: this.maxRetryAttempts,
                    baseUrl: this.baseUrl,
                });

                return;
            } else {
                throw this.createApiError(response, request, attempt);
            }
        } catch (error) {
            responseTimestamp = new Date().toISOString();
            this.logger.error(`Attempt ${attempt} failed:`, error);
            this.captureSentryError(error, request, attempt);

            // Log failed request
            await this.apiLogService.logFailedRequest(request.Seq, requestTimestamp, responseTimestamp, request, error, {
                attempt: attempt,
                maxRetryAttempts: this.maxRetryAttempts,
                baseUrl: this.baseUrl,
            });

            if (attempt >= this.maxRetryAttempts) {
                this.handleMaxRetryReached(request, attempt);
                throw error;
            }

            await this.handleRetry(request, attempt);
        }
    }

    private async makeRequest(request: ApiRequest): Promise<ApiResponse> {
        const { body, headers, apiEndpoint } = this.prepareRequest(request);

        this.logger.log(`Making HTTP POST request to: ${apiEndpoint}`, { headers, body });

        try {
            const response = await this.executeHttpRequest(apiEndpoint, body, headers);
            this.logger.log(`API response received: ${response.status} ${response.statusText}`, { responseData: response.data });

            this.validateResponse(response, request);
            this.storeSuccessfulRequest(request, headers, response.data);

            this.logger.log(`Request sent successfully. Total stored requests: ${this.storedRequests.length}`);
            return response.data as ApiResponse;
        } catch (error) {
            return this.handleRequestError(error, request, headers);
        }
    }

    private logAttempt(request: ApiRequest, attempt: number): void {
        this.logger.log(`Attempting to send ${request.Payload.Tickets.length} tickets (attempt ${attempt})`);
    }

    private addSentryBreadcrumb(request: ApiRequest, attempt: number): void {
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
    }

    private createApiError(response: ApiResponse, request: ApiRequest, attempt: number): Error {
        const errorDetails = this.createBaseErrorDetails(request, attempt);
        errorDetails.message = response.ErrorMessage;
        errorDetails.code = response.ErrorCode;

        return new Error(
            `API Error: ${response.ErrorMessage} (Code: ${response.ErrorCode}) - Request Details: ${JSON.stringify(errorDetails)}`,
        );
    }

    private captureSentryError(error: any, request: ApiRequest, attempt: number): void {
        this.sentryService.captureException(error, {
            method: 'sendWithRetry',
            attempt: attempt,
            maxRetryAttempts: this.maxRetryAttempts,
            ticketCount: request.Payload.Tickets.length,
            sequenceId: request.Seq,
            baseUrl: this.baseUrl,
            isMaxRetryReached: attempt >= this.maxRetryAttempts,
        });
    }

    private handleMaxRetryReached(request: ApiRequest, attempt: number): void {
        this.logger.error(`Max retry attempts (${this.maxRetryAttempts}) reached. Giving up.`);

        this.sentryService.captureMessage(`API request failed after ${this.maxRetryAttempts} attempts`, 'error', {
            method: 'sendWithRetry',
            sequenceId: request.Seq,
            ticketCount: request.Payload.Tickets.length,
            baseUrl: this.baseUrl,
            finalAttempt: attempt,
        });
    }

    private async handleRetry(request: ApiRequest, attempt: number): Promise<void> {
        const delay = this.calculateRetryDelay(attempt);
        this.logger.log(`Retrying in ${delay}ms...`);

        await this.delay(delay);
        await this.sendWithRetry(request, attempt + 1);
    }

    private calculateRetryDelay(attempt: number): number {
        return this.retryBaseDelay * Math.pow(2, attempt - 1);
    }

    private prepareRequest(request: ApiRequest): { body: string; headers: any; apiEndpoint: string } {
        const body = JSON.stringify(request);
        const operatorSign = this.calculateOperatorSign(body);

        const headers = {
            'Content-Type': 'application/json',
            'operator-pwd': this.operatorPwd,
            'operator-sign': operatorSign,
        };

        const apiEndpoint = `${this.baseUrl}/api/OperatorApi/ImportExtTicket`;

        return { body, headers, apiEndpoint };
    }

    private calculateOperatorSign(body: string): string {
        return crypto
            .createHash('md5')
            .update(body + this.operatorKey)
            .digest('hex');
    }

    private async executeHttpRequest(apiEndpoint: string, body: string, headers: any): Promise<any> {
        return firstValueFrom(
            this.httpService.post(apiEndpoint, body, {
                headers,
                timeout: 60000, // 60 second timeout
            }),
        );
    }

    private validateResponse(response: any, request: ApiRequest): void {
        if (!response.data || typeof response.data !== 'object') {
            const errorDetails = {
                ...this.createBaseErrorDetails(request),
                responseStatus: response.status,
                responseStatusText: response.statusText,
                responseDataType: typeof response.data,
                responseData: response.data,
            };

            throw new Error(`Invalid response format from API - Response Details: ${JSON.stringify(errorDetails)}`);
        }
    }

    private storeSuccessfulRequest(request: ApiRequest, headers: any, responseData: any): void {
        this.storedRequests.push({
            ...request,
            _storedAt: new Date().toISOString(),
            _headers: headers,
            _response: responseData,
        });
    }

    private handleRequestError(error: any, request: ApiRequest, headers: any): never {
        this.logger.error(`HTTP request failed:`, error);

        const errorInfo = this.extractErrorInfo(error);
        this.logger.error(`Error details:`, errorInfo);

        this.storeFailedRequest(request, headers, errorInfo);
        throw this.createEnhancedError(error, request);
    }

    private extractErrorInfo(error: any): any {
        return {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            code: error.code,
            timeout: error.timeout,
        };
    }

    private storeFailedRequest(request: ApiRequest, headers: any, errorInfo: any): void {
        this.storedRequests.push({
            ...request,
            _storedAt: new Date().toISOString(),
            _headers: headers,
            _error: errorInfo,
        });
    }

    private createEnhancedError(error: any, request: ApiRequest): Error {
        const enhancedErrorDetails = {
            ...this.createBaseErrorDetails(request),
            originalMessage: error.message,
            status: error.response?.status || 'Unknown',
            statusText: error.response?.statusText,
            errorCode: error.code,
            timeout: error.timeout,
        };

        const enhancedError = new Error(
            `API request failed: ${error.message} (Status: ${error.response?.status || 'Unknown'}) - Request Details: ${JSON.stringify(enhancedErrorDetails)}`,
        );
        enhancedError.stack = error.stack;

        return enhancedError;
    }

    private createBaseErrorDetails(request: ApiRequest, attempt?: number): any {
        return {
            sequenceId: request.Seq,
            ticketCount: request.Payload.Tickets.length,
            timestamp: request.Timestamp,
            attempt: attempt,
            baseUrl: this.baseUrl,
        };
    }

    private generateSequenceId(): string {
        return `seq_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
