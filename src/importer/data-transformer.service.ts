import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';

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

    transformTickets(tickets: any[]): TransformedTicket[] {
        this.logger.log(`Transforming ${tickets.length} tickets`);
        
        return tickets.map(ticket => this.transformTicket(ticket));
    }

    private transformTicket(ticket: any): TransformedTicket {
        // Determine transaction status based on winloss
        let status: number;
        if (ticket.winloss > 0) {
            status = 1; // Win
        } else if (ticket.winloss < 0) {
            status = 2; // Lose
        } else {
            status = 3; // Draw
        }

        // Use the appropriate currency data (USD or VND based on the ticket's currency)
        const currencyData = ticket.USD || ticket.VND || {};
        const currencyIso = this.getCurrencyIso(ticket.code);

        return {
            GameId: ticket.gameId.toString(),
            CustId: ticket.playerId,
            CustName: ticket.playerId, // Using playerId as name since CustName is not available
            GameRoundId: ticket.roundId.toString(),
            TransDate: moment(ticket.time).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
            SettleDate: moment(ticket.roundTime).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
            Stake: this.roundToFourDecimals(currencyData.stake || ticket.stake || 0),
            ActualStake: this.roundToFourDecimals(currencyData.stake || ticket.stake || 0),
            NetStake: this.roundToFourDecimals(currencyData.stake || ticket.stake || 0),
            Payout: this.roundToFourDecimals(currencyData.payout || ticket.payout || 0),
            Status: status,
            CurrencyIso: currencyIso,
            JackpotContributionAmount: this.roundToFourDecimals(0), // Not available in source data
        };
    }

    private getCurrencyIso(code: string): string {
        // Map currency codes to ISO codes
        const currencyMap: { [key: string]: string } = {
            'VND': 'VND',
            'USD': 'USD',
            'INR': 'INR',
            'IDR': 'IDR',
            'INH': 'INH',
        };

        return currencyMap[code] || code;
    }

    private roundToFourDecimals(value: number): number {
        return Math.round(value * 10000) / 10000;
    }
}




