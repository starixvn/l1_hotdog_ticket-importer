import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TicketService } from '../ticket/ticket.service';
import { ApiClientService } from './api-client.service';
import { DataTransformerService } from './data-transformer.service';

@Injectable()
export class ImporterService {
    private readonly logger = new Logger(ImporterService.name);

    constructor(
        private readonly ticketService: TicketService,
        private readonly apiClientService: ApiClientService,
        private readonly dataTransformerService: DataTransformerService,
    ) {}

    // Run every 5 minutes
    @Cron(CronExpression.EVERY_5_MINUTES)
    async processTickets(): Promise<void> {
        this.logger.log('Starting ticket import process...');

        try {
            // Get tickets from MongoDB
            const tickets = await this.ticketService.getTicketsFromLastProcessed();

            if (tickets.length === 0) {
                this.logger.log('No new tickets to process');
                return;
            }

            // Transform tickets to API format
            const transformedTickets = this.dataTransformerService.transformTickets(tickets);

            // Send tickets in batches
            await this.sendTicketsInBatches(transformedTickets);

            // Update last processed time
            await this.ticketService.updateLastProcessedTime();

            this.logger.log('Ticket import process completed successfully');
        } catch (error) {
            this.logger.error('Error in ticket import process:', error);
        }
    }

    private async sendTicketsInBatches(tickets: any[]): Promise<void> {
        const batchSize = parseInt(process.env.BATCH_SIZE || '100');
        const delayMs = parseInt(process.env.REQUEST_DELAY_MS || '10000');

        for (let i = 0; i < tickets.length; i += batchSize) {
            const batch = tickets.slice(i, i + batchSize);

            this.logger.log(
                `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tickets.length / batchSize)} with ${batch.length} tickets`,
            );

            try {
                await this.apiClientService.sendTickets(batch);
                this.logger.log(`Successfully sent batch ${Math.floor(i / batchSize) + 1}`);
            } catch (error) {
                this.logger.error(`Failed to send batch ${Math.floor(i / batchSize) + 1}:`, error);
                // Continue with next batch even if one fails
            }

            // Wait between requests (except for the last batch)
            if (i + batchSize < tickets.length) {
                this.logger.log(`Waiting ${delayMs}ms before next request...`);
                await this.delay(delayMs);
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
