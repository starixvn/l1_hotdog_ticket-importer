import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TicketSilo, TicketSiloDocument } from '../database/schemas/ticket-silo.schema';
import { ProcessedBatch, ProcessedBatchDocument } from '../database/schemas/ticket-importer-last-processed';

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);

    constructor(
        @InjectModel(TicketSilo.name) private ticketSiloModel: Model<TicketSiloDocument>,
        @InjectModel(ProcessedBatch.name) private processedBatchModel: Model<ProcessedBatchDocument>,
    ) {}

    async getHealthStatus() {
        try {
            // Check database connection
            const connectionState = this.ticketSiloModel.db.readyState;
            if (connectionState !== 1) {
                throw new Error(`Database not connected. State: ${connectionState}`);
            }

            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            };
        } catch (error) {
            this.logger.error('Health check failed:', error);
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
            };
        }
    }

    async getDetailedHealthStatus() {
        try {
            const startTime = Date.now();

            // Check database connection
            const connectionState = this.ticketSiloModel.db.readyState;
            if (connectionState !== 1) {
                throw new Error(`Database not connected. State: ${connectionState}`);
            }

            // Get collection stats
            const ticketCount = await this.ticketSiloModel.countDocuments();
            const lastProcessed = await this.processedBatchModel.findOne({}, {}, { sort: { ticketTime: -1 } });

            // Get recent tickets count (last 24 hours)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const recentTicketsCount = await this.ticketSiloModel.countDocuments({
                time: { $gte: yesterday },
            });

            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: {
                    connected: true,
                    responseTime: `${responseTime}ms`,
                    totalTickets: ticketCount,
                    recentTickets24h: recentTicketsCount,
                },
                lastProcessed: lastProcessed
                    ? {
                          time: lastProcessed.ticketTime,
                          batchId: lastProcessed.batchId,
                          batchSize: lastProcessed.batchSize,
                          createdAt: lastProcessed.createdAt,
                      }
                    : null,
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    external: Math.round(process.memoryUsage().external / 1024 / 1024),
                },
            };
        } catch (error) {
            this.logger.error('Detailed health check failed:', error);
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                uptime: process.uptime(),
            };
        }
    }
}
