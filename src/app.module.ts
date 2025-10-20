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
import { DatabaseConnectionService } from './database/database-connection.service';
import configuration from './config/configuration';

// Helper function to construct MongoDB URI
function constructMongoUri(baseUri: string, dbName: string): string {
    // Check if URI already contains a database name
    const uriPattern = /^mongodb:\/\/[^\/]+\/([^?]+)/;
    const hasDbInUri = uriPattern.test(baseUri);
    const hasQueryParams = baseUri.includes('?');

    let finalUri;
    if (hasDbInUri) {
        // URI already has database name, use as is
        finalUri = baseUri;
    } else if (hasQueryParams) {
        // URI has query parameters, insert database name before the '?'
        if (baseUri.includes('/?')) {
            finalUri = baseUri.replace('/?', `/${dbName}?`);
        } else {
            finalUri = baseUri.replace('?', `/${dbName}?`);
        }
        // Add authSource=admin if not already present
        if (!finalUri.includes('authSource=')) {
            finalUri += '&authSource=admin';
        }
    } else {
        // URI has no database name and no query parameters, append database name
        finalUri = `${baseUri}/${dbName}`;
    }

    return finalUri;
}

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            expandVariables: true,
        }),
        // Primary database connection
        MongooseModule.forRootAsync({
            useFactory: (configService: ConfigService) => {
                const baseUri = configService.get<string>('database.uri');
                const dbName = configService.get<string>('database.name');

                const finalUri = constructMongoUri(baseUri, dbName);

                console.log('🔌 Connecting to primary MongoDB database...');
                console.log(`   Base URI: ${baseUri}`);
                console.log(`   Database: ${dbName}`);
                console.log(`   Final URI: ${finalUri}`);

                return {
                    uri: finalUri,
                    retryWrites: true,
                    w: 'majority',
                    maxPoolSize: 10,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                    connectTimeoutMS: 10000,
                };
            },
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
    providers: [DatabaseConnectionService],
    controllers: [AppController],
})
export class AppModule {}
