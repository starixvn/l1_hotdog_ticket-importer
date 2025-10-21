import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { TicketSilo, TicketSiloDocument } from '../database/schemas/ticket-silo.schema';
import { ProcessedBatch, ProcessedBatchDocument } from '../database/schemas/ticket-importer-last-processed';
import { SentryService } from '../common/services/sentry.service';
import { CurrencyService } from '../config/currency.service';
import * as moment from 'moment';

@Injectable()
export class TicketService {
    private readonly logger = new Logger(TicketService.name);

    constructor(
        @InjectModel(TicketSilo.name) private readonly ticketSiloModel: Model<TicketSiloDocument>,
        @InjectModel(ProcessedBatch.name) private readonly processedBatchModel: Model<ProcessedBatchDocument>,
        private readonly configService: ConfigService,
        private readonly sentryService: SentryService,
        private readonly currencyService: CurrencyService,
    ) {}

    async getTicketsFromLastProcessed(): Promise<TicketSilo[]> {
        let lastProcessed: Date;
        try {
            lastProcessed = await this.getLastProcessedTime();
            const endTime = this.calculateEndTime();
            const operatorId = this.getOperatorId();
            const processedTicketIds = await this.getProcessedTicketIds();

            this.logQueryParameters(lastProcessed, endTime, operatorId, processedTicketIds.length);

            const tickets = await this.queryTickets(lastProcessed, endTime, operatorId, processedTicketIds);
            const filteredTickets = this.filterTicketsByCurrency(tickets);

            this.logger.log(`Found ${tickets.length} tickets to process for operatorId: ${operatorId}`);
            this.logger.log(`Filtered to ${filteredTickets.length} tickets with valid currency mappings`);
            return filteredTickets;
        } catch (error) {
            this.logger.error('Error fetching tickets:', error);
            // Capture error with Sentry for monitoring
            this.sentryService.captureException(error, {
                method: 'getTicketsFromLastProcessed',
                operatorId: this.configService.get<string>('importer.operatorId'),
                lastProcessed: lastProcessed?.toISOString(),
            });
            throw error;
        }
    }

    private calculateEndTime(): Date {
        return moment().subtract(10, 'minutes').toDate();
    }

    private getOperatorId(): string {
        const operatorId = this.configService.get<string>('importer.operatorId');

        // Debug: Log all configuration values
        this.logger.debug(`Configuration values:`, {
            operatorId,
            allImporterConfig: this.configService.get('importer'),
        });

        return operatorId;
    }

    private async getProcessedTicketIds(): Promise<string[]> {
        const processedBatches = await this.processedBatchModel.find({}, 'ticketIds').lean();
        return processedBatches.flatMap((batch) => batch.ticketIds);
    }

    private logQueryParameters(lastProcessed: Date, endTime: Date, operatorId: string, processedTicketCount: number): void {
        this.logger.log(
            `Querying tickets from ${lastProcessed} to ${endTime} for operatorId: ${operatorId}, excluding ${processedTicketCount} already processed tickets`,
        );
    }

    private async queryTickets(
        lastProcessed: Date,
        endTime: Date,
        operatorId: string,
        processedTicketIds: string[],
    ): Promise<TicketSilo[]> {
        // Define constant for repeated literal
        const SUB_ROUND_ID_FIELD = '$subRoundId';

        return this.ticketSiloModel
            .find({
                time: {
                    $gt: lastProcessed,
                    $lte: endTime,
                },
                operatorId: operatorId,
                // Exclude already processed tickets
                $expr: {
                    $not: {
                        $in: [
                            {
                                $concat: [
                                    '$playerId',
                                    '_',
                                    { $toString: '$gameId' },
                                    '_',
                                    {
                                        $cond: {
                                            if: {
                                                $and: [{ $ne: [SUB_ROUND_ID_FIELD, '$roundId'] }, { $gt: [SUB_ROUND_ID_FIELD, 0] }],
                                            },
                                            then: { $toString: SUB_ROUND_ID_FIELD },
                                            else: { $toString: '$roundId' },
                                        },
                                    },
                                ],
                            },
                            processedTicketIds,
                        ],
                    },
                },
            })
            .sort({ time: 1 })
            .lean();
    }

    private filterTicketsByCurrency(tickets: TicketSilo[]): TicketSilo[] {
        return tickets.filter((ticket) => {
            const hasValidCurrency = this.currencyService.mapCurrencyNameToISO(ticket.currency) !== undefined;

            if (!hasValidCurrency) {
                this.logger.debug(`Filtering out ticket with unsupported currency: ${ticket.currency}`);
            }

            return hasValidCurrency;
        });
    }

    async updateLastProcessed(time: Date, tickets: TicketSilo[]): Promise<void> {
        try {
            // Generate ticket IDs for this batch using the same logic as data transformer
            const ticketIds = tickets.map((ticket) => {
                const gameRoundId = ticket.subRoundId !== ticket.roundId && ticket.subRoundId > 0 ? ticket.subRoundId : ticket.roundId;
                return `${ticket.playerId}_${ticket.gameId}_${gameRoundId}`;
            });

            // Create a processed batch record
            const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            const processedBatch = {
                batchId,
                ticketIds,
                ticketTime: time,
                batchSize: tickets.length,
            };

            // Insert the processed batch record
            await this.processedBatchModel.create(processedBatch);

            this.logger.log(`Added processed batch ${batchId} with ${tickets.length} tickets`);
        } catch (error) {
            this.logger.error('Error updating processed batch:', error);
            throw error;
        }
    }

    async getLastProcessedTime(): Promise<Date> {
        try {
            // Get the latest processed batch time
            const latestProcessed = await this.processedBatchModel.findOne({}, {}, { sort: { ticketTime: -1 } }).lean();

            if (!latestProcessed) {
                // If no processed batches exist, start from 10 days ago
                const defaultTime = moment().subtract(10, 'days').toDate();
                this.logger.log(`No processed batches found, using default: ${defaultTime}`);
                return defaultTime;
            }

            return latestProcessed.ticketTime;
        } catch (error) {
            this.logger.error('Error getting last processed time:', error);
            // Return a default time if there's an error
            return moment().subtract(10, 'days').toDate();
        }
    }
}
