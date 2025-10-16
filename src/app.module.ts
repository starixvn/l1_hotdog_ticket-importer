import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { TicketModule } from './ticket/ticket.module';
import { ImporterModule } from './importer/importer.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';
import configuration from './config/configuration';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            expandVariables: true,
        }),
        MongooseModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                uri: `${configService.get<string>('database.uri')}/${configService.get<string>('database.name')}`,
            }),
            inject: [ConfigService],
        }),
        ScheduleModule.forRoot(),
        HttpModule,
        DatabaseModule,
        TicketModule,
        ImporterModule,
        HealthModule,
        CommonModule,
    ],
    controllers: [AppController],
})
export class AppModule {}
