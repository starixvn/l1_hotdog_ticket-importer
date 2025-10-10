import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketSilo, TicketSiloSchema } from './schemas/ticket-silo.schema';
import { LastProcessedTime, LastProcessedTimeSchema } from './schemas/last-processed-time.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: TicketSilo.name, schema: TicketSiloSchema },
            { name: LastProcessedTime.name, schema: LastProcessedTimeSchema },
        ]),
    ],
    exports: [MongooseModule],
})
export class DatabaseModule {}




