import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { TicketService } from './ticket.service';

@Module({
    imports: [DatabaseModule, ConfigModule],
    providers: [TicketService],
    exports: [TicketService],
})
export class TicketModule {}
