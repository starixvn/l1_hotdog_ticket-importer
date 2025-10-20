import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiLogService } from './api-log.service';

@Controller('api-logs')
export class ApiLogController {
    constructor(private readonly apiLogService: ApiLogService) {}

    /**
     * Get API logs with pagination and filtering
     */
    @Get()
    async getApiLogs(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50',
        @Query('operatorId') operatorId?: string,
        @Query('status') status?: 'success' | 'failed',
        @Query('errorCode') errorCode?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const result = await this.apiLogService.getApiLogs(parseInt(page), parseInt(limit), {
            operatorId,
            status,
            errorCode: errorCode ? parseInt(errorCode) : undefined,
            startDate,
            endDate,
        });

        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get API statistics
     */
    @Get('statistics')
    async getApiStatistics(
        @Query('operatorId') operatorId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const stats = await this.apiLogService.getApiStatistics(operatorId, startDate, endDate);

        return {
            success: true,
            statistics: stats,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get logs for a specific sequence ID
     */
    @Get('seq/:seqId')
    async getLogsBySeq(@Param('seqId') seqId: string) {
        // This would need to be implemented in the service
        return {
            success: true,
            message: `Logs for sequence ${seqId}`,
            timestamp: new Date().toISOString(),
        };
    }
}
