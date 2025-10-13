import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProcessedBatchDocument = ProcessedBatch & Document;

@Schema({ collection: 'ticket_importer_last_processed' })
export class ProcessedBatch {
    @Prop({ required: true, unique: true })
    batchId: string; // Format: batch_{timestamp}_{random}

    @Prop({ required: true, type: [String] })
    ticketIds: string[]; // Array of {CustId}_{GameId}_{GameRoundId}

    @Prop({ required: true, type: Date })
    ticketTime: Date;

    @Prop({ required: true })
    batchSize: number;

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const ProcessedBatchSchema = SchemaFactory.createForClass(ProcessedBatch);
