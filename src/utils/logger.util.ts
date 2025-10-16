import { Logger } from '@nestjs/common';

export class LoggerUtil {
    private static instance: LoggerUtil;
    private readonly logger: Logger;

    private constructor() {
        this.logger = new Logger('TicketImporter');
    }

    public static getInstance(): LoggerUtil {
        if (!LoggerUtil.instance) {
            LoggerUtil.instance = new LoggerUtil();
        }
        return LoggerUtil.instance;
    }

    public log(message: string, context?: string) {
        this.logger.log(message, context);
    }

    public error(message: string, trace?: string, context?: string) {
        this.logger.error(message, trace, context);
    }

    public warn(message: string, context?: string) {
        this.logger.warn(message, context);
    }

    public debug(message: string, context?: string) {
        this.logger.debug(message, context);
    }

    public verbose(message: string, context?: string) {
        this.logger.verbose(message, context);
    }
}
