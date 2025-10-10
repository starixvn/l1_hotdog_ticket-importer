import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { TicketModule } from './ticket/ticket.module';
import { ImporterModule } from './importer/importer.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket_importer'),
        ScheduleModule.forRoot(),
        HttpModule,
        DatabaseModule,
        TicketModule,
        ImporterModule,
        HealthModule,
    ],
    controllers: [AppController],
})
export class AppModule {}
