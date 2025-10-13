import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketSilo, TicketSiloSchema } from './schemas/ticket-silo.schema';
import { ProcessedBatch, ProcessedBatchSchema } from './schemas/ticket_importer_last_processed';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: TicketSilo.name, schema: TicketSiloSchema },
            { name: ProcessedBatch.name, schema: ProcessedBatchSchema },
        ]),
    ],
    exports: [MongooseModule],
})
export class DatabaseModule {}
