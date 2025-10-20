import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketSilo, TicketSiloSchema } from './schemas/ticket-silo.schema';
import { ProcessedBatch, ProcessedBatchSchema } from './schemas/ticket-importer-last-processed';
import { DatabaseConnectionService } from './database-connection.service';
import { DynamicDatabaseService } from './dynamic-database.service';
import { DatabaseSwitchController } from './database-switch.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: TicketSilo.name, schema: TicketSiloSchema },
            { name: ProcessedBatch.name, schema: ProcessedBatchSchema },
        ]),
    ],
    controllers: [DatabaseSwitchController],
    providers: [DatabaseConnectionService, DynamicDatabaseService],
    exports: [MongooseModule, DatabaseConnectionService, DynamicDatabaseService],
})
export class DatabaseModule {}
