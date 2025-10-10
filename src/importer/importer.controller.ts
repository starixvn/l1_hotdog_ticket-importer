import { Controller, Post, Get } from '@nestjs/common';
import { ImporterService } from './importer.service';
import { ApiClientService } from './api-client.service';

@Controller('importer')
export class ImporterController {
    constructor(
        private readonly importerService: ImporterService,
        private readonly apiClientService: ApiClientService,
    ) {}

    @Post('process')
    triggerProcessTickets() {
        // Start processing in background without waiting
        this.importerService.processTickets().catch((error) => {
            console.error('Background processing error:', error);
        });

        return {
            success: true,
            message: 'Ticket processing triggered successfully (running in background)',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('stored-requests')
    getStoredRequests() {
        const requests = this.apiClientService.getStoredRequests();
        return {
            count: requests.length,
            requests: requests,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('stored-requests/count')
    getStoredRequestsCount() {
        return {
            count: this.apiClientService.getStoredRequestsCount(),
            timestamp: new Date().toISOString(),
        };
    }

    @Post('clear-requests')
    clearStoredRequests() {
        this.apiClientService.clearStoredRequests();
        return {
            success: true,
            message: 'All stored requests cleared',
            timestamp: new Date().toISOString(),
        };
    }
}
