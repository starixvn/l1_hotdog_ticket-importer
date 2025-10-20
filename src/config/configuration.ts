import { ConfigLoaderService } from './config-loader.service';

// Create a singleton instance of the config loader
const configLoader = new ConfigLoaderService();

export default () => {
    const config = configLoader.getConfig();

    return {
        port: config.application.port,
        nodeEnv: config.application.nodeEnv,

        database: {
            uri: config.database.uri,
            maindb: config.database.maindb,
            log: config.database.log || 'log',
        },

        api: {
            baseUrl: config.api.baseUrl,
            operatorPwd: config.api.operatorPwd,
            operatorKey: config.api.operatorKey,
        },

        importer: {
            batchSize: config.importer.batchSize,
            requestDelayMs: config.importer.requestDelayMs,
            maxRetryAttempts: config.importer.maxRetryAttempts,
            retryBaseDelayMs: config.importer.retryBaseDelayMs,
            operatorId: config.importer.operatorId,
        },

        logging: {
            level: config.application.logLevel,
        },

        sentry: {
            dsn: config.sentry.dsn,
            environment: config.sentry.environment,
            release: config.sentry.release,
            enabled: !!config.sentry.dsn,
        },
    };
};
