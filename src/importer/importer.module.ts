import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TicketModule } from '../ticket/ticket.module';
import { ImporterService } from './importer.service';
import { ImporterController } from './importer.controller';
import { ApiClientService } from './api-client.service';
import { DataTransformerService } from './data-transformer.service';

@Module({
    imports: [HttpModule, TicketModule],
    controllers: [ImporterController],
    providers: [ImporterService, ApiClientService, DataTransformerService],
    exports: [ImporterService],
})
export class ImporterModule {}
