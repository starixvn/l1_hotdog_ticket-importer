import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryService {
    private readonly logger = new Logger(SentryService.name);

    /**
     * Capture an exception manually
     */
    captureException(exception: Error, context?: Record<string, any>): void {
        Sentry.captureException(exception, {
            tags: {
                component: 'manual',
            },
            extra: context,
        });
        this.logger.error(`Exception captured: ${exception.message}`, exception.stack);
    }

    /**
     * Capture a message manually
     */
    captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
        Sentry.captureMessage(message, {
            level: level,
            tags: {
                component: 'manual',
            },
            extra: context,
        });
        this.logger.log(`Message captured: ${message}`);
    }

    /**
     * Add breadcrumb for debugging
     */
    addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
        Sentry.addBreadcrumb(breadcrumb);
    }

    /**
     * Set user context
     */
    setUser(user: Sentry.User): void {
        Sentry.setUser(user);
    }

    /**
     * Set tags
     */
    setTags(tags: Record<string, string>): void {
        Sentry.setTags(tags);
    }

    /**
     * Set extra context
     */
    setExtra(key: string, value: any): void {
        Sentry.setExtra(key, value);
    }

    /**
     * Set context
     */
    setContext(key: string, context: Record<string, any>): void {
        Sentry.setContext(key, context);
    }

    /**
     * Check if Sentry is enabled
     */
    isEnabled(): boolean {
        return !!process.env.SENTRY_DSN;
    }
}
