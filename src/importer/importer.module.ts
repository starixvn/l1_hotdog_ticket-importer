import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TicketModule } from '../ticket/ticket.module';
import { CommonModule } from '../common/common.module';
import { CurrencyModule } from '../config/currency.module';
import { ImporterService } from './importer.service';
import { ImporterController } from './importer.controller';
import { ApiClientService } from './api-client.service';
import { DataTransformerService } from './data-transformer.service';

@Module({
    imports: [HttpModule, TicketModule, CommonModule, CurrencyModule],
    controllers: [ImporterController],
    providers: [ImporterService, ApiClientService, DataTransformerService],
    exports: [ImporterService],
})
export class ImporterModule {}
