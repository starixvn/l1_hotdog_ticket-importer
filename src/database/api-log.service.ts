import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiLog, ApiLogDocument } from './schemas/api-log.schema';
import { ConfigService } from '@nestjs/config';

export interface ApiLogData {
    operatorId: string;
    logTimeStamp: string;
    requestTimeStamp: string;
    call: {
        Timestamp: string;
        Seq: string;
        Payload: {
            Tickets: any[];
        };
        [key: string]: any;
    };
    responseTimeStamp: string;
    result: {
        seq: string;
        errorCode: number;
        errorMessage?: string;
        errorDescription?: string;
        [key: string]: any;
    };
    status: 'success' | 'failed';
    responseTimeMs?: number;
    httpStatus?: string;
    metadata?: {
        attempt?: number;
        maxRetryAttempts?: number;
        baseUrl?: string;
        [key: string]: any;
    };
}

@Injectable()
export class ApiLogService {
    private readonly logger = new Logger(ApiLogService.name);

    constructor(
        @InjectModel(ApiLog.name) private readonly apiLogModel: Model<ApiLogDocument>,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Log a successful API request
     */
    async logSuccessRequest(
        seq: string,
        requestTimestamp: string,
        responseTimestamp: string,
        requestPayload: any,
        apiResponse: any,
        metadata?: any,
    ): Promise<void> {
        try {
            const logData: ApiLogData = {
                operatorId: this.configService.get<string>('importer.operatorId', 'SabaPlay_HD'),
                logTimeStamp: new Date().toISOString(),
                requestTimeStamp: requestTimestamp,
                call: {
                    Timestamp: requestPayload.Timestamp,
                    Seq: requestPayload.Seq,
                    Payload: requestPayload.Payload,
                },
                responseTimeStamp: responseTimestamp,
                result: {
                    seq: seq,
                    errorCode: apiResponse.ErrorCode || 0,
                    errorMessage: apiResponse.ErrorMessage || null,
                    errorDescription: apiResponse.ErrorDescription || null,
                },
                status: 'success',
                responseTimeMs: this.calculateResponseTime(requestTimestamp, responseTimestamp),
                httpStatus: '200',
                metadata: metadata,
            };

            this.logger.debug(`Creating API log with data:`, JSON.stringify(logData, null, 2));
            await this.apiLogModel.create(logData);
            this.logger.log(`API success logged for seq: ${seq}`);
        } catch (error) {
            this.logger.error(`Failed to log success request for seq ${seq}:`, error);
        }
    }

    /**
     * Log a failed API request
     */
    async logFailedRequest(
        seq: string,
        requestTimestamp: string,
        responseTimestamp: string,
        requestPayload: any,
        error: any,
        metadata?: any,
    ): Promise<void> {
        try {
            const logData: ApiLogData = {
                operatorId: this.configService.get<string>('importer.operatorId', 'SabaPlay_HD'),
                logTimeStamp: new Date().toISOString(),
                requestTimeStamp: requestTimestamp,
                call: {
                    Timestamp: requestPayload.Timestamp,
                    Seq: requestPayload.Seq,
                    Payload: requestPayload.Payload,
                },
                responseTimeStamp: responseTimestamp,
                result: {
                    seq: seq,
                    errorCode: this.extractErrorCode(error),
                    errorMessage: this.extractErrorMessage(error),
                    errorDescription: this.extractErrorDescription(error),
                },
                status: 'failed',
                responseTimeMs: this.calculateResponseTime(requestTimestamp, responseTimestamp),
                httpStatus: this.extractHttpStatus(error),
                metadata: metadata,
            };

            this.logger.debug(`Creating API log with data:`, JSON.stringify(logData, null, 2));
            await this.apiLogModel.create(logData);
            this.logger.log(`API failure logged for seq: ${seq}`);
        } catch (logError) {
            this.logger.error(`Failed to log failed request for seq ${seq}:`, logError);
        }
    }

    /**
     * Get API logs with pagination and filtering
     */
    async getApiLogs(
        page: number = 1,
        limit: number = 50,
        filters: {
            operatorId?: string;
            status?: 'success' | 'failed';
            errorCode?: number;
            startDate?: string;
            endDate?: string;
        } = {},
    ) {
        const skip = (page - 1) * limit;
        const query: any = {};

        if (filters.operatorId) {
            query.operatorId = filters.operatorId;
        }
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.errorCode !== undefined) {
            query['result.errorCode'] = filters.errorCode;
        }
        if (filters.startDate || filters.endDate) {
            query.logTimeStamp = {};
            if (filters.startDate) {
                query.logTimeStamp.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.logTimeStamp.$lte = filters.endDate;
            }
        }

        const [logs, total] = await Promise.all([
            this.apiLogModel.find(query).sort({ logTimeStamp: -1 }).skip(skip).limit(limit).lean(),
            this.apiLogModel.countDocuments(query),
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get API statistics
     */
    async getApiStatistics(operatorId?: string, startDate?: string, endDate?: string) {
        const matchQuery: any = {};
        if (operatorId) matchQuery.operatorId = operatorId;
        if (startDate || endDate) {
            matchQuery.logTimeStamp = {};
            if (startDate) matchQuery.logTimeStamp.$gte = startDate;
            if (endDate) matchQuery.logTimeStamp.$lte = endDate;
        }

        const stats = await this.apiLogModel.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    successful: {
                        $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
                    },
                    failed: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
                    },
                    avgResponseTime: { $avg: '$responseTimeMs' },
                    errorCodes: {
                        $push: {
                            $cond: [{ $eq: ['$status', 'failed'] }, '$result.errorCode', null],
                        },
                    },
                },
            },
            {
                $project: {
                    total: 1,
                    successful: 1,
                    failed: 1,
                    successRate: {
                        $multiply: [{ $divide: ['$successful', '$total'] }, 100],
                    },
                    avgResponseTime: { $round: ['$avgResponseTime', 2] },
                    errorCodeDistribution: {
                        $reduce: {
                            input: '$errorCodes',
                            initialValue: {},
                            in: {
                                $mergeObjects: [
                                    '$$value',
                                    {
                                        $arrayToObject: [
                                            [
                                                {
                                                    k: { $toString: '$$this' },
                                                    v: {
                                                        $add: [
                                                            {
                                                                $getField: {
                                                                    field: { $toString: '$$this' },
                                                                    input: '$$value',
                                                                },
                                                            },
                                                            1,
                                                        ],
                                                    },
                                                },
                                            ],
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        ]);

        return (
            stats[0] || {
                total: 0,
                successful: 0,
                failed: 0,
                successRate: 0,
                avgResponseTime: 0,
                errorCodeDistribution: {},
            }
        );
    }

    private calculateResponseTime(requestTimestamp: string, responseTimestamp: string): number {
        const requestTime = new Date(requestTimestamp).getTime();
        const responseTime = new Date(responseTimestamp).getTime();
        return responseTime - requestTime;
    }

    private extractErrorCode(error: any): number {
        if (error.response?.data?.ErrorCode) return error.response.data.ErrorCode;
        if (error.code) return parseInt(error.code) || -1;
        return -1;
    }

    private extractErrorMessage(error: any): string {
        if (error.response?.data?.ErrorMessage) return error.response.data.ErrorMessage;
        if (error.message) return error.message;
        return 'Unknown error';
    }

    private extractErrorDescription(error: any): string {
        if (error.response?.data?.ErrorDescription) return error.response.data.ErrorDescription;
        return null;
    }

    private extractHttpStatus(error: any): string {
        if (error.response?.status) return error.response.status.toString();
        if (error.status) return error.status.toString();
        return 'Unknown';
    }
}
