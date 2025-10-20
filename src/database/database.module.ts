import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketSilo, TicketSiloSchema } from './schemas/ticket-silo.schema';
import { ProcessedBatch, ProcessedBatchSchema } from './schemas/ticket-importer-last-processed';
import { ApiLog, ApiLogSchema } from './schemas/api-log.schema';
import { DatabaseConnectionService } from './database-connection.service';
import { DynamicDatabaseService } from './dynamic-database.service';
import { ApiLogService } from './api-log.service';
import { DatabaseSwitchController } from './database-switch.controller';
import { ApiLogController } from './api-log.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: TicketSilo.name, schema: TicketSiloSchema },
            { name: ProcessedBatch.name, schema: ProcessedBatchSchema },
        ]),
        MongooseModule.forFeature([{ name: ApiLog.name, schema: ApiLogSchema }], 'log'),
    ],
    controllers: [DatabaseSwitchController, ApiLogController],
    providers: [DatabaseConnectionService, DynamicDatabaseService, ApiLogService],
    exports: [MongooseModule, DatabaseConnectionService, DynamicDatabaseService, ApiLogService],
})
export class DatabaseModule {}
