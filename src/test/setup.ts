import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigLoaderService } from '../config/config-loader.service';
import configuration from '../config/configuration';

// Mock the ConfigLoaderService for testing
jest.mock('../config/config-loader.service');

export async function createTestingModule(providers: any[] = []) {
    const module: TestingModule = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration],
                expandVariables: true,
            }),
            MongooseModule.forRoot('mongodb://localhost:27017/ticket_importer_test'),
        ],
        providers: [
            ...providers,
            {
                provide: ConfigLoaderService,
                useValue: {
                    getConfig: jest.fn().mockReturnValue({
                        database: {
                            uri: 'mongodb://localhost:27017',
                            name: 'ticket_importer_test',
                        },
                        api: {
                            baseUrl: 'https://api.test.com',
                            operatorPwd: 'test_password',
                            operatorKey: 'test_key',
                        },
                        importer: {
                            batchSize: 10,
                            requestDelayMs: 1000,
                            maxRetryAttempts: 2,
                            retryBaseDelayMs: 500,
                            operatorId: 'TestOperator',
                        },
                        application: {
                            port: 3001,
                            nodeEnv: 'test',
                            logLevel: 'debug',
                        },
                        sentry: {
                            dsn: 'https://test@sentry.io/test',
                            environment: 'test',
                            release: '1.0.0',
                        },
                    }),
                    getDatabaseConfig: jest.fn().mockReturnValue({
                        uri: 'mongodb://localhost:27017',
                        name: 'ticket_importer_test',
                    }),
                    getApiConfig: jest.fn().mockReturnValue({
                        baseUrl: 'https://api.test.com',
                        operatorPwd: 'test_password',
                        operatorKey: 'test_key',
                    }),
                    getImporterConfig: jest.fn().mockReturnValue({
                        batchSize: 10,
                        requestDelayMs: 1000,
                        maxRetryAttempts: 2,
                        retryBaseDelayMs: 500,
                        operatorId: 'TestOperator',
                    }),
                    getApplicationConfig: jest.fn().mockReturnValue({
                        port: 3001,
                        nodeEnv: 'test',
                        logLevel: 'debug',
                    }),
                    getSentryConfig: jest.fn().mockReturnValue({
                        dsn: 'https://test@sentry.io/test',
                        environment: 'test',
                        release: '1.0.0',
                    }),
                },
            },
        ],
    }).compile();

    return module;
}

export const mockTicket = {
    _id: '68b7bac8dbdc8fd66e470c38',
    currency: 'INH',
    operatorId: 'TestOperator',
    currencyGroupId: '61b953ad815d6c000196a14c',
    siteName: 'test',
    code: 'VND',
    isTest: 0,
    _roundId: '68b7bac8dbdc8fd66e470c38',
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
        roundSummary: '000006254336709881633800',
        hourlyStatement: '000006448535086584106447',
        dailyStatement: '000000884192065300749325',
    },
    __archive: {
        summarized: true,
        hourly: true,
        daily: true,
        eventtime: new Date('2025-09-03T03:49:28.781Z'),
        v: '3.0.6',
    },
};

export const mockTransformedTicket = {
    GameId: '155',
    CustId: '9625700',
    CustName: '9625700',
    GameRoundId: '115',
    TransDate: '2025-09-03T03:49:28.781Z',
    SettleDate: '2025-09-03T03:49:28.781Z',
    Stake: 1.05,
    ActualStake: 1.05,
    NetStake: 1.05,
    Payout: 0,
    Status: 2,
    CurrencyIso: 'VND',
    JackpotContributionAmount: 0,
};

export const mockApiResponse = {
    Timestamp: '2025-09-03T03:49:28.781Z',
    Seq: '12345',
    ErrorCode: 0,
    ErrorMessage: 'Success',
};

export const mockProcessedBatch = {
    _id: 'batch_123',
    batchId: 'batch_123',
    ticketIds: ['9625700_155_115'],
    ticketTime: new Date('2025-09-03T03:49:28.781Z'),
    batchSize: 1,
};
