import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
    constructor(private configService: ConfigService) {}

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
            },
        };
    }

    @Get('config')
    getConfig() {
        return {
            operatorId: this.configService.get<string>('importer.operatorId'),
            allImporterConfig: this.configService.get('importer'),
            envOperatorId: process.env.OPERATOR_ID,
        };
    }
}
