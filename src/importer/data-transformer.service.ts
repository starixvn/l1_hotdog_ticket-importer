import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { CurrencyService } from '../config/currency.service';

export interface InputTicket {
    gameId: number;
    playerId: string;
    roundId: number;
    subRoundId: number;
    time: string | Date;
    roundTime: string | Date;
    stake: number;
    payout: number;
    winloss: number;
    refund: number;
    currency: string;
}

export interface TransformedTicket {
    GameId: string;
    CustId: string;
    CustName: string;
    GameRoundId: string;
    TransDate: string;
    SettleDate: string;
    Stake: number;
    ActualStake: number;
    NetStake: number;
    Payout: number;
    Status: number;
    CurrencyIso: string;
    JackpotContributionAmount: number;
}

@Injectable()
export class DataTransformerService {
    private readonly logger = new Logger(DataTransformerService.name);

    constructor(private readonly currencyService: CurrencyService) {}

    transformTickets(tickets: InputTicket[]): TransformedTicket[] {
        this.logger.log(`Transforming ${tickets.length} tickets`);

        return tickets.map((ticket) => this.transformTicket(ticket));
    }

    private transformTicket(ticket: InputTicket): TransformedTicket {
        const status = this.determineTicketStatus(ticket);
        const stakeAmount = this.roundToFourDecimals(ticket.stake || 0);
        const payoutAmount = this.roundToFourDecimals(ticket.payout || 0);

        // Use subRoundId if it's different from roundId and subRoundId > 0
        const gameRoundId =
            ticket.subRoundId !== ticket.roundId && ticket.subRoundId > 0 ? ticket.subRoundId.toString() : ticket.roundId.toString();

        return {
            GameId: ticket.gameId.toString(),
            CustId: ticket.playerId,
            CustName: ticket.playerId, // Using playerId as name since CustName is not available
            GameRoundId: gameRoundId,
            TransDate: this.formatDate(ticket.roundTime),
            SettleDate: this.formatDate(ticket.roundTime),
            Stake: stakeAmount,
            ActualStake: stakeAmount,
            NetStake: stakeAmount,
            Payout: payoutAmount,
            Status: status,
            CurrencyIso: this.mapCurrencyToISO(ticket.currency),
            JackpotContributionAmount: this.roundToFourDecimals(0), // Not available in source data
        };
    }

    private determineTicketStatus(ticket: InputTicket): number {
        if (ticket.refund > 0) {
            return 6; // Refund
        }
        if (ticket.winloss > 0) {
            return 1; // Win
        }
        if (ticket.winloss < 0) {
            return 2; // Lose
        }
        return 3; // Draw
    }

    private formatDate(date: string | Date): string {
        return moment(date).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    }

    private mapCurrencyToISO(currency: string): string {
        const isoCode = this.currencyService.mapCurrencyNameToISO(currency);
        if (isoCode) {
            this.logger.debug(`Mapped currency '${currency}' to ISO code '${isoCode}'`);
            return isoCode;
        } else {
            this.logger.warn(`No mapping found for currency '${currency}', using original value`);
            return currency;
        }
    }

    private roundToFourDecimals(value: number): number {
        return Math.round(value * 10000) / 10000;
    }
}
