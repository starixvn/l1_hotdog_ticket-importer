export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket_importer',
    },

    api: {
        baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
        operatorPwd: process.env.API_OPERATOR_PWD || 'rmt727hm',
        operatorSign: process.env.API_OPERATOR_SIGN || '',
    },

    importer: {
        batchSize: parseInt(process.env.BATCH_SIZE, 10) || 100,
        requestDelayMs: parseInt(process.env.REQUEST_DELAY_MS, 10) || 10000,
        maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS, 10) || 5,
        retryBaseDelayMs: parseInt(process.env.RETRY_BASE_DELAY_MS, 10) || 1000,
        operatorId: process.env.OPERATOR_ID || 'ONEworksVGCash',
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },

    sentry: {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
        release: process.env.SENTRY_RELEASE || '1.0.0',
        enabled: !!process.env.SENTRY_DSN,
    },
});
