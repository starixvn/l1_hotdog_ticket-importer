import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TicketSilo, TicketSiloDocument } from '../database/schemas/ticket-silo.schema';
import { LastProcessedTime, LastProcessedTimeDocument } from '../database/schemas/last-processed-time.schema';
import * as moment from 'moment';

@Injectable()
export class TicketService {
    private readonly logger = new Logger(TicketService.name);

    constructor(
        @InjectModel(TicketSilo.name) private ticketSiloModel: Model<TicketSiloDocument>,
        @InjectModel(LastProcessedTime.name) private lastProcessedTimeModel: Model<LastProcessedTimeDocument>,
    ) {}

    async getTicketsFromLastProcessed(): Promise<TicketSilo[]> {
        try {
            // Get the last processed time
            const lastProcessed = await this.getLastProcessedTime();
            
            // Calculate the end time (current time - 10 minutes)
            const endTime = moment().subtract(10, 'minutes').toDate();
            
            this.logger.log(`Querying tickets from ${lastProcessed} to ${endTime}`);

            const tickets = await this.ticketSiloModel
                .find({
                    time: {
                        $gt: lastProcessed,
                        $lte: endTime,
                    },
                })
                .sort({ time: 1 })
                .lean();

            this.logger.log(`Found ${tickets.length} tickets to process`);
            return tickets;
        } catch (error) {
            this.logger.error('Error fetching tickets:', error);
            throw error;
        }
    }

    async updateLastProcessedTime(): Promise<void> {
        try {
            const currentTime = moment().subtract(10, 'minutes').toDate();
            
            await this.lastProcessedTimeModel.findOneAndUpdate(
                { key: 'ticket_importer' },
                { 
                    lastProcessedTime: currentTime,
                    updatedAt: new Date(),
                },
                { upsert: true, new: true }
            );

            this.logger.log(`Updated last processed time to ${currentTime}`);
        } catch (error) {
            this.logger.error('Error updating last processed time:', error);
            throw error;
        }
    }

    private async getLastProcessedTime(): Promise<Date> {
        try {
            const lastProcessed = await this.lastProcessedTimeModel.findOne({ key: 'ticket_importer' });
            
            if (!lastProcessed) {
                // If no last processed time exists, start from 24 hours ago
                const defaultTime = moment().subtract(24, 'hours').toDate();
                this.logger.log(`No last processed time found, using default: ${defaultTime}`);
                return defaultTime;
            }

            return lastProcessed.lastProcessedTime;
        } catch (error) {
            this.logger.error('Error getting last processed time:', error);
            // Return a default time if there's an error
            return moment().subtract(24, 'hours').toDate();
        }
    }
}




