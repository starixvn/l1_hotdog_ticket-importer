import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
    private readonly logger = new Logger(SentryInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((error) => {
                // Capture the error with Sentry
                Sentry.captureException(error, {
                    tags: {
                        component: 'nestjs',
                    },
                    extra: {
                        context: context.getClass().name,
                        handler: context.getHandler().name,
                        timestamp: new Date().toISOString(),
                    },
                });

                // Log the error locally
                this.logger.error(`Error captured by Sentry: ${error.message}`, error.stack);

                // Re-throw the error to maintain normal error handling flow
                return throwError(() => error);
            }),
        );
    }
}
