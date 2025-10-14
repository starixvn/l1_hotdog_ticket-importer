import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SentryInterceptor } from './interceptors/sentry.interceptor';
import { SentryService } from './services/sentry.service';

@Module({
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: SentryInterceptor,
        },
        SentryService,
    ],
    exports: [SentryService],
})
export class CommonModule {}
