import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
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
            },
        };
    }
}
