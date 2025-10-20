import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface AppConfig {
    database: {
        uri: string;
        maindb: string;
        log?: string;
    };
    api: {
        baseUrl: string;
        operatorPwd: string;
        operatorKey: string;
    };
    importer: {
        batchSize: number;
        requestDelayMs: number;
        maxRetryAttempts: number;
        retryBaseDelayMs: number;
        operatorId: string;
    };
    application: {
        port: number;
        nodeEnv: string;
        logLevel: string;
    };
    sentry: {
        dsn: string;
        environment: string;
        release: string;
    };
}

@Injectable()
export class ConfigLoaderService {
    private readonly logger = new Logger(ConfigLoaderService.name);
    private config: AppConfig;

    constructor() {
        this.loadConfig();
    }

    private loadConfig(): void {
        try {
            // Try to load from compiled location first
            let configPath = path.resolve(__dirname, '../config.json');

            // If not found, try project root
            if (!fs.existsSync(configPath)) {
                configPath = path.resolve(process.cwd(), 'config.json');
            }

            this.logger.log(`🔍 Loading configuration from: ${configPath}`);

            if (fs.existsSync(configPath)) {
                const configContent = fs.readFileSync(configPath, 'utf8');
                this.config = JSON.parse(configContent);
                this.logger.log('✅ Configuration loaded successfully from JSON file');
                this.logger.log(`📄 Configuration contains: ${Object.keys(this.config).join(', ')}`);
            } else {
                this.logger.warn('⚠️ config.json file not found, using default configuration');
                this.config = this.getDefaultConfig();
            }

            // Configuration loaded from JSON file only
        } catch (error) {
            this.logger.error('❌ Failed to load configuration:', error.message);
            this.logger.log('ℹ️ Using default configuration');
            this.config = this.getDefaultConfig();
        }
    }

    private getDefaultConfig(): AppConfig {
        return {
            database: {
                uri: 'mongodb://localhost:27017',
                maindb: 'hotdog_minigame',
                log: 'log',
            },
            api: {
                baseUrl: 'https://api.example.com',
                operatorPwd: 'rmt727hm',
                operatorKey: 'your_operator_key',
            },
            importer: {
                batchSize: 100,
                requestDelayMs: 10000,
                maxRetryAttempts: 5,
                retryBaseDelayMs: 1000,
                operatorId: 'ONEworksVGCash',
            },
            application: {
                port: 3000,
                nodeEnv: 'development',
                logLevel: 'info',
            },
            sentry: {
                dsn: '',
                environment: 'development',
                release: '1.0.0',
            },
        };
    }

    getConfig(): AppConfig {
        return this.config;
    }

    getDatabaseConfig() {
        return this.config.database;
    }

    getApiConfig() {
        return this.config.api;
    }

    getImporterConfig() {
        return this.config.importer;
    }

    getApplicationConfig() {
        return this.config.application;
    }

    getSentryConfig() {
        return this.config.sentry;
    }
}
