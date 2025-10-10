import { Test, TestingModule } from '@nestjs/testing';
import { ImporterService } from './importer.service';
import { TicketService } from '../ticket/ticket.service';
import { ApiClientService } from './api-client.service';
import { DataTransformerService } from './data-transformer.service';
import { Types } from 'mongoose';

describe('ImporterService', () => {
    let service: ImporterService;
    let ticketService: TicketService;
    let apiClientService: ApiClientService;
    let dataTransformerService: DataTransformerService;

    const mockTicket = {
        _id: new Types.ObjectId('68b7bac8dbdc8fd66e470c38'),
        currency: 'INH',
        operatorId: 'ONEworksVGCash',
        currencyGroupId: new Types.ObjectId('61b953ad815d6c000196a14c'),
        siteName: 'lumi',
        code: 'VND',
        isTest: 0,
        _roundId: new Types.ObjectId('68b7bac8dbdc8fd66e470c38'),
        time: new Date('2025-09-03T03:49:28.781Z'),
        roundTime: new Date('2025-09-03T03:49:28.781Z'),
        gameId: 155,
        siteId: '',
        roundId: 115,
        subRoundId: 115,
        tickets: 1,
        stake: 1.05,
        payout: 0,
        refund: 0,
        playerId: '9625700',
        winloss: -1.05,
        USD: {
            stake: 0.0417,
            payout: 0,
            refund: 0,
            winloss: -0.0417,
            win: 0,
            loss: -0.0417,
        },
        VND: {
            stake: 1050.0,
            payout: 0,
            refund: 0,
            winloss: -1050.0,
            win: 0,
            loss: -1050.0,
        },
        win: 0,
        loss: -1.05,
        __v: '3.5.0',
        _ids: {
            roundSummary: new Types.ObjectId('000006254336709881633800'),
            hourlyStatement: new Types.ObjectId('000006448535086584106447'),
            dailyStatement: new Types.ObjectId('000000884192065300749325'),
        },
        __archive: {
            summarized: true,
            hourly: true,
            daily: true,
            eventtime: new Date('2025-09-03T03:49:28.781Z'),
            v: '3.0.6',
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ImporterService,
                {
                    provide: TicketService,
                    useValue: {
                        getTicketsFromLastProcessed: jest.fn(),
                        updateLastProcessedTime: jest.fn(),
                    },
                },
                {
                    provide: ApiClientService,
                    useValue: {
                        sendTickets: jest.fn(),
                    },
                },
                {
                    provide: DataTransformerService,
                    useValue: {
                        transformTickets: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ImporterService>(ImporterService);
        ticketService = module.get<TicketService>(TicketService);
        apiClientService = module.get<ApiClientService>(ApiClientService);
        dataTransformerService = module.get<DataTransformerService>(DataTransformerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should process tickets successfully', async () => {
        const mockTickets = [mockTicket];
        const mockTransformedTickets = [
            {
                GameId: '155',
                CustId: '9625700',
                CustName: '9625700',
                GameRoundId: '115',
                TransDate: '2025-09-03T03:49:28.781Z',
                SettleDate: '2025-09-03T03:49:28.781Z',
                Stake: 1050.0,
                ActualStake: 1050.0,
                NetStake: 1050.0,
                Payout: 0.0,
                Status: 2,
                CurrencyIso: 'VND',
                JackpotContributionAmount: 0.0,
            },
        ];

        jest.spyOn(ticketService, 'getTicketsFromLastProcessed').mockResolvedValue(mockTickets);
        jest.spyOn(dataTransformerService, 'transformTickets').mockReturnValue(mockTransformedTickets);
        jest.spyOn(apiClientService, 'sendTickets').mockResolvedValue(undefined);
        jest.spyOn(ticketService, 'updateLastProcessedTime').mockResolvedValue(undefined);

        await service.processTickets();

        expect(ticketService.getTicketsFromLastProcessed).toHaveBeenCalled();
        expect(dataTransformerService.transformTickets).toHaveBeenCalledWith(mockTickets);
        expect(apiClientService.sendTickets).toHaveBeenCalledWith(mockTransformedTickets);
        expect(ticketService.updateLastProcessedTime).toHaveBeenCalled();
    });

    it('should handle empty tickets gracefully', async () => {
        jest.spyOn(ticketService, 'getTicketsFromLastProcessed').mockResolvedValue([]);

        await service.processTickets();

        expect(ticketService.getTicketsFromLastProcessed).toHaveBeenCalled();
        expect(dataTransformerService.transformTickets).not.toHaveBeenCalled();
        expect(apiClientService.sendTickets).not.toHaveBeenCalled();
        expect(ticketService.updateLastProcessedTime).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        const error = new Error('Database connection failed');
        jest.spyOn(ticketService, 'getTicketsFromLastProcessed').mockRejectedValue(error);

        await expect(service.processTickets()).resolves.not.toThrow();
    });
});
