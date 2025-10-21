import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { TicketSilo, TicketSiloDocument } from '../database/schemas/ticket-silo.schema';
import { ProcessedBatch, ProcessedBatchDocument } from '../database/schemas/ticket-importer-last-processed';
import { SentryService } from '../common/services/sentry.service';
import * as moment from 'moment';

@Injectable()
export class TicketService {
    private readonly logger = new Logger(TicketService.name);

    constructor(
        @InjectModel(TicketSilo.name) private readonly ticketSiloModel: Model<TicketSiloDocument>,
        @InjectModel(ProcessedBatch.name) private readonly processedBatchModel: Model<ProcessedBatchDocument>,
        private readonly configService: ConfigService,
        private readonly sentryService: SentryService,
    ) {}

    async getTicketsFromLastProcessed(): Promise<TicketSilo[]> {
        let lastProcessed: Date;
        try {
            // Get the last processed time
            lastProcessed = await this.getLastProcessedTime();

            // Calculate the end time (current time - 10 minutes)
            const endTime = moment().subtract(10, 'minutes').toDate();

            // Get operatorId from configuration
            const operatorId = this.configService.get<string>('importer.operatorId');

            // Debug: Log all configuration values
            this.logger.debug(`Configuration values:`, {
                operatorId,
                allImporterConfig: this.configService.get('importer'),
            });

            // Get all processed ticket IDs from all batches
            const processedBatches = await this.processedBatchModel.find({}, 'ticketIds').lean();
            const processedTicketIds = processedBatches.flatMap((batch) => batch.ticketIds);

            this.logger.log(
                `Querying tickets from ${lastProcessed} to ${endTime} for operatorId: ${operatorId}, excluding ${processedTicketIds.length} already processed tickets`,
            );

            const tickets = await this.ticketSiloModel
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
                                                    $and: [{ $ne: ['$subRoundId', '$roundId'] }, { $gt: ['$subRoundId', 0] }],
                                                },
                                                then: { $toString: '$subRoundId' },
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

            this.logger.log(`Found ${tickets.length} tickets to process for operatorId: ${operatorId}`);
            return tickets;
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
