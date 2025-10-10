import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketSiloDocument = TicketSilo & Document;

@Schema({ collection: 'ticket_silos' })
export class TicketSilo {
    @Prop({ type: Types.ObjectId })
    _id: Types.ObjectId;

    @Prop({ required: true })
    currency: string;

    @Prop({ required: true })
    operatorId: string;

    @Prop({ type: Types.ObjectId })
    currencyGroupId: Types.ObjectId;

    @Prop({ required: true })
    siteName: string;

    @Prop({ required: true })
    code: string;

    @Prop({ default: 0 })
    isTest: number;

    @Prop({ type: Types.ObjectId })
    _roundId: Types.ObjectId;

    @Prop({ type: Date })
    time: Date;

    @Prop({ type: Date })
    roundTime: Date;

    @Prop({ required: true })
    gameId: number;

    @Prop({ default: '' })
    siteId: string;

    @Prop({ required: true })
    roundId: number;

    @Prop({ required: true })
    subRoundId: number;

    @Prop({ required: true })
    tickets: number;

    @Prop({ type: Number })
    stake: number;

    @Prop({ type: Number })
    payout: number;

    @Prop({ type: Number })
    refund: number;

    @Prop({ required: true })
    playerId: string;

    @Prop({ type: Number })
    winloss: number;

    @Prop({ type: Object })
    USD: {
        stake: number;
        payout: number;
        refund: number;
        winloss: number;
        win: number;
        loss: number;
    };

    @Prop({ type: Object })
    VND: {
        stake: number;
        payout: number;
        refund: number;
        winloss: number;
        win: number;
        loss: number;
    };

    @Prop({ type: Number })
    win: number;

    @Prop({ type: Number })
    loss: number;

    @Prop({ default: '3.5.0' })
    __v: string;

    @Prop({ type: Object })
    _ids: {
        roundSummary: Types.ObjectId;
        hourlyStatement: Types.ObjectId;
        dailyStatement: Types.ObjectId;
    };

    @Prop({ type: Object })
    __archive: {
        summarized: boolean;
        hourly: boolean;
        daily: boolean;
        eventtime: Date;
        v: string;
    };
}

export const TicketSiloSchema = SchemaFactory.createForClass(TicketSilo);
