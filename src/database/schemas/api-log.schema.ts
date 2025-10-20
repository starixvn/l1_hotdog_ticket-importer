import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApiLogDocument = ApiLog & Document;

@Schema({ collection: 'api_logs' })
export class ApiLog {
    @Prop({ required: true })
    operatorId: string;

    @Prop({ required: true })
    logTimeStamp: string; // ISO string

    @Prop({ required: true })
    requestTimeStamp: string; // ISO string

    @Prop({ required: true, type: Object })
    call: {
        Timestamp: string;
        Seq: string;
        Payload: {
            Tickets: any[];
        };
        [key: string]: any;
    };

    @Prop({ required: true })
    responseTimeStamp: string; // ISO string

    @Prop({ required: true, type: Object })
    result: {
        seq: string;
        errorCode: number;
        errorMessage?: string;
        errorDescription?: string;
        [key: string]: any;
    };

    @Prop({ type: String })
    status: 'success' | 'failed';

    @Prop({ type: Number })
    responseTimeMs?: number;

    @Prop({ type: String })
    httpStatus?: string;

    @Prop({ type: Object })
    metadata?: {
        attempt?: number;
        maxRetryAttempts?: number;
        baseUrl?: string;
        [key: string]: any;
    };
}

export const ApiLogSchema = SchemaFactory.createForClass(ApiLog);

// Create indexes for better query performance
ApiLogSchema.index({ logTimeStamp: -1 });
ApiLogSchema.index({ operatorId: 1, logTimeStamp: -1 });
ApiLogSchema.index({ 'call.seq': 1 });
ApiLogSchema.index({ 'result.errorCode': 1, logTimeStamp: -1 });
ApiLogSchema.index({ status: 1, logTimeStamp: -1 });
