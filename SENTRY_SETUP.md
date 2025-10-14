# Sentry Error Logging Setup

This document explains how Sentry error logging is configured in the ticket importer application.

## Overview

Sentry has been integrated into the application to provide comprehensive error monitoring and performance tracking. The integration includes:

- Automatic error capture via interceptors
- Manual error reporting via SentryService
- Performance monitoring and profiling
- Environment-specific configuration

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
# Sentry Configuration
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=1.0.0
```

### Getting Your Sentry DSN

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project for your NestJS application
3. Copy the DSN from your project settings
4. Replace `your_sentry_dsn_here` with your actual DSN

## Features

### Automatic Error Capture

The `SentryInterceptor` automatically captures all unhandled exceptions in your application:

```typescript
// Automatically captures errors from all controllers and services
@Controller('api')
export class ApiController {
    @Get('test')
    async test() {
        throw new Error('This will be captured by Sentry');
    }
}
```

### Manual Error Reporting

Use the `SentryService` for manual error reporting and context setting:

```typescript
import { SentryService } from '../common/services/sentry.service';

@Injectable()
export class MyService {
    constructor(private sentryService: SentryService) {}

    async processData() {
        try {
            // Your logic here
        } catch (error) {
            // Manual error capture with context
            this.sentryService.captureException(error, {
                method: 'processData',
                userId: 'user123',
                additionalData: 'some context',
            });
            throw error;
        }
    }

    // Add breadcrumbs for debugging
    trackUserAction(action: string) {
        this.sentryService.addBreadcrumb({
            message: `User performed: ${action}`,
            category: 'user-action',
            level: 'info',
        });
    }

    // Set user context
    setUserContext(userId: string, email: string) {
        this.sentryService.setUser({
            id: userId,
            email: email,
        });
    }
}
```

### Performance Monitoring

The application includes performance monitoring with:

- Request tracing
- Database query monitoring
- Custom performance metrics

## File Structure

```
src/
├── common/
│   ├── interceptors/
│   │   └── sentry.interceptor.ts    # Automatic error capture
│   ├── services/
│   │   └── sentry.service.ts        # Manual error reporting
│   └── common.module.ts             # Module configuration
├── config/
│   └── configuration.ts             # Sentry configuration
└── main.ts                          # Sentry initialization
```

## Usage Examples

### Basic Error Capture

```typescript
// Automatic capture (via interceptor)
@Get('users/:id')
async getUser(@Param('id') id: string) {
    if (!id) {
        throw new BadRequestException('User ID is required');
    }
    // This error will be automatically captured
}

// Manual capture
async processTicket(ticket: Ticket) {
    try {
        await this.validateTicket(ticket);
    } catch (error) {
        this.sentryService.captureException(error, {
            ticketId: ticket.id,
            operation: 'validateTicket'
        });
        throw error;
    }
}
```

### Adding Context

```typescript
// Set user context
this.sentryService.setUser({
    id: 'user123',
    email: 'user@example.com',
});

// Add tags
this.sentryService.setTags({
    feature: 'ticket-import',
    version: '1.0.0',
});

// Add extra data
this.sentryService.setExtra('batchSize', 100);
```

### Breadcrumbs for Debugging

```typescript
// Add breadcrumbs to track user actions
this.sentryService.addBreadcrumb({
    message: 'User started ticket import',
    category: 'user-action',
    level: 'info',
});

this.sentryService.addBreadcrumb({
    message: 'Processing batch of 50 tickets',
    category: 'processing',
    level: 'info',
});
```

## Environment-Specific Configuration

### Development

- Lower sampling rates for performance monitoring
- More verbose logging
- Debug mode enabled

### Production

- Higher sampling rates
- Optimized performance
- Release tracking

## Monitoring and Alerts

Configure alerts in your Sentry dashboard for:

- Error rate thresholds
- Performance degradation
- New error types
- Release health

## Best Practices

1. **Don't capture sensitive data**: Avoid logging passwords, tokens, or personal information
2. **Use meaningful context**: Provide relevant context with each error
3. **Set appropriate sampling rates**: Balance monitoring needs with performance
4. **Monitor release health**: Track error rates after deployments
5. **Use breadcrumbs**: Add breadcrumbs for complex workflows

## Troubleshooting

### Sentry Not Capturing Errors

1. Check that `SENTRY_DSN` is set correctly
2. Verify the DSN is valid and the project exists
3. Check network connectivity to Sentry
4. Review application logs for Sentry initialization messages

### Performance Issues

1. Adjust sampling rates in `main.ts`
2. Disable profiling in development if not needed
3. Monitor Sentry quota usage

### Missing Context

1. Ensure `SentryService` is injected where needed
2. Check that context is set before errors occur
3. Verify breadcrumbs are added at appropriate points
