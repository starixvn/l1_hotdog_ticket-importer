import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConnectionService } from './database/database-connection.service';

@Controller()
export class AppController {
    constructor(
        private readonly configService: ConfigService,
        private readonly databaseConnectionService: DatabaseConnectionService,
    ) {}

    @Get()
    getRoot() {
        return {
            message: 'Ticket Importer Service',
            version: '1.0.0',
            status: 'running',
            timestamp: new Date().toISOString(),
            endpoints: {
                health: '/health',
                healthDetailed: '/health/detailed',
                config: '/config',
                databaseStatus: '/database-status',
                databaseList: '/database/list',
                databaseSwitch: '/database/switch/{dbName}',
                databaseCollections: '/database/collections/{dbName}',
                databaseQuery: '/database/query/{dbName}/{collectionName}',
                apiLogs: '/api-logs',
                apiLogsStats: '/api-logs/statistics',
            },
        };
    }

    @Get('config')
    getConfig() {
        return {
            operatorId: this.configService.get<string>('importer.operatorId'),
            allImporterConfig: this.configService.get('importer'),
            databaseConfig: this.configService.get('database'),
            apiConfig: this.configService.get('api'),
            applicationConfig: this.configService.get('application'),
            sentryConfig: this.configService.get('sentry'),
        };
    }

    @Get('database-status')
    getDatabaseStatus() {
        const dbStatus = this.databaseConnectionService.getConnectionStatus();
        return {
            ...dbStatus,
            status: dbStatus.isConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
        };
    }
}
