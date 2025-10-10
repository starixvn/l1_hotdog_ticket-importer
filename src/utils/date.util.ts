import * as moment from 'moment';

export class DateUtil {
    /**
     * Get current time in ISO format
     */
    static getCurrentTimeISO(): string {
        return moment().toISOString();
    }

    /**
     * Get time 10 minutes ago in ISO format
     */
    static getTime10MinutesAgoISO(): string {
        return moment().subtract(10, 'minutes').toISOString();
    }

    /**
     * Get time 10 minutes ago as Date object
     */
    static getTime10MinutesAgo(): Date {
        return moment().subtract(10, 'minutes').toDate();
    }

    /**
     * Format date to API format (YYYY-MM-DDTHH:mm:ss.SSSZ)
     */
    static formatForAPI(date: Date): string {
        return moment(date).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    }

    /**
     * Parse date from various formats
     */
    static parseDate(date: string | Date | number): Date {
        return moment(date).toDate();
    }

    /**
     * Check if date is within the last N minutes
     */
    static isWithinLastMinutes(date: Date, minutes: number): boolean {
        const cutoff = moment().subtract(minutes, 'minutes');
        return moment(date).isAfter(cutoff);
    }

    /**
     * Get start of day in GMT-4 timezone
     */
    static getStartOfDayGMT4(): Date {
        return moment().utcOffset(-4).startOf('day').toDate();
    }

    /**
     * Get end of day in GMT-4 timezone
     */
    static getEndOfDayGMT4(): Date {
        return moment().utcOffset(-4).endOf('day').toDate();
    }
}




