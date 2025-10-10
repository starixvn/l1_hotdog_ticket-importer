import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LastProcessedTimeDocument = LastProcessedTime & Document;

@Schema({ collection: 'ticket_importer_last_processed_times' })
export class LastProcessedTime {
    @Prop({ required: true, unique: true })
    key: string;

    @Prop({ required: true, type: Date })
    lastProcessedTime: Date;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const LastProcessedTimeSchema = SchemaFactory.createForClass(LastProcessedTime);
