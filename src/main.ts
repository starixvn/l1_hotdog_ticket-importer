import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables before anything else
config({ path: path.resolve(__dirname, '../.env') });

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    // Log startup attempt
    console.log('🚀 Starting Ticket Importer Service...');
    logger.log('🚀 Starting Ticket Importer Service...');

    // Debug environment variables
    console.log('🔍 Environment variables check:');
    console.log('  - SENTRY_DSN:', process.env.SENTRY_DSN ? 'SET' : 'NOT SET');
    console.log('  - SENTRY_DSN value:', process.env.SENTRY_DSN ? process.env.SENTRY_DSN.substring(0, 20) + '...' : 'undefined');
    console.log('  - NODE_ENV:', process.env.NODE_ENV || 'undefined');
    console.log('  - PORT:', process.env.PORT || 'undefined');
    console.log(
        '  - All env keys containing SENTRY:',
        Object.keys(process.env).filter((key) => key.includes('SENTRY')),
    );

    // Initialize Sentry
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
            release: process.env.SENTRY_RELEASE || '1.0.0',
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

    const port = process.env.PORT || 3000;
    console.log(`🌐 Starting server on port ${port}...`);
    logger.log(`🌐 Starting server on port ${port}...`);

    await app.listen(port);

    // Log application startup information
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔍 Sentry monitoring: ${process.env.SENTRY_DSN ? 'Enabled' : 'Disabled'}`);
    console.log(`📝 Log level: ${process.env.LOG_LEVEL || 'info'}`);
    console.log(`✅ Ticket Importer Service started successfully!`);

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🔍 Sentry monitoring: ${process.env.SENTRY_DSN ? 'Enabled' : 'Disabled'}`);
    logger.log(`📝 Log level: ${process.env.LOG_LEVEL || 'info'}`);
    logger.log(`✅ Ticket Importer Service started successfully!`);

    // Send startup message to Sentry
    if (process.env.SENTRY_DSN) {
        Sentry.captureMessage('Ticket Importer Service started successfully', {
            level: 'info',
            tags: {
                event: 'application_startup',
                environment: process.env.NODE_ENV || 'development',
            },
            extra: {
                port: port,
                logLevel: process.env.LOG_LEVEL || 'info',
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
