import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { ConfigLoaderService } from './config/config-loader.service';

// Load configuration from JSON file
const configLoader = new ConfigLoaderService();
const config = configLoader.getConfig();

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    // Log startup attempt
    console.log('🚀 Starting Ticket Importer Service...');
    logger.log('🚀 Starting Ticket Importer Service...');

    // Debug configuration
    console.log('🔍 Configuration loaded:');
    console.log('  - Database URI:', config.database.uri ? 'SET' : 'NOT SET');
    console.log('  - API Base URL:', config.api.baseUrl);
    console.log('  - Sentry DSN:', config.sentry.dsn ? 'SET' : 'NOT SET');
    console.log('  - Node Environment:', config.application.nodeEnv);
    console.log('  - Port:', config.application.port);
    console.log('  - Operator ID:', config.importer.operatorId);

    // Initialize Sentry
    if (config.sentry.dsn) {
        Sentry.init({
            dsn: config.sentry.dsn,
            environment: config.sentry.environment || config.application.nodeEnv || 'development',
            release: config.sentry.release || '1.0.0',
            integrations: [nodeProfilingIntegration()],
            // Performance Monitoring
            tracesSampleRate: 1.0,
            // Set sampling rate for profiling - this is relative to tracesSampleRate
            profilesSampleRate: 1.0,
        });
        console.log('✅ Sentry initialized successfully');
        logger.log('✅ Sentry initialized successfully');
    } else {
        console.log('⚠️ Sentry DSN not provided, error tracking disabled');
        logger.warn('⚠️ Sentry DSN not provided, error tracking disabled');
    }

    console.log('📦 Creating NestJS application...');
    logger.log('📦 Creating NestJS application...');
    const app = await NestFactory.create(AppModule);

    // Enable CORS if needed
    app.enableCors();

    const port = config.application.port;
    console.log(`🌐 Starting server on port ${port}...`);
    logger.log(`🌐 Starting server on port ${port}...`);

    await app.listen(port);

    // Log application startup information
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📊 Environment: ${config.application.nodeEnv}`);
    console.log(`🔍 Sentry monitoring: ${config.sentry.dsn ? 'Enabled' : 'Disabled'}`);
    console.log(`📝 Log level: ${config.application.logLevel}`);
    console.log(`✅ Ticket Importer Service started successfully!`);

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📊 Environment: ${config.application.nodeEnv}`);
    logger.log(`🔍 Sentry monitoring: ${config.sentry.dsn ? 'Enabled' : 'Disabled'}`);
    logger.log(`📝 Log level: ${config.application.logLevel}`);
    logger.log(`✅ Ticket Importer Service started successfully!`);

    // Send startup message to Sentry
    if (config.sentry.dsn) {
        Sentry.captureMessage('Ticket Importer Service started successfully', {
            level: 'info',
            tags: {
                event: 'application_startup',
                environment: config.application.nodeEnv,
            },
            extra: {
                port: port,
                logLevel: config.application.logLevel,
                timestamp: new Date().toISOString(),
            },
        });
    }
}

// Add error handling for bootstrap
bootstrap().catch((error) => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
});
