import { FuturesClient, FuturesSymbolRule, RestClientV2 } from 'bitget-api'

export const mockFuturesClient: jest.Mocked<FuturesClient> = {
    setLeverage: jest.fn(),
    setMarginMode: jest.fn(),
    submitStopOrder: jest.fn(),
    modifyStopOrder: jest.fn(),
    modifyPlanOrderTPSL: jest.fn(),
    cancelPlanOrderTPSL: jest.fn(),
    modifyOrder: jest.fn(),
    cancelOrder: jest.fn(),
    submitOrder: jest.fn(),
} as unknown as jest.Mocked<FuturesClient>;

export const mockRestClientV2: jest.Mocked<RestClientV2> = {
    getFuturesPosition: jest.fn(),
    futuresFlashClosePositions: jest.fn(),
} as unknown as jest.Mocked<RestClientV2>;

export const createMockSymbolRules = (symbolRules: Partial<FuturesSymbolRule> = {}): FuturesSymbolRule => ({
    baseCoin: 'BTC',
    buyLimitPriceRatio: '0.01',
    feeRateUpRatio: '0.005',
    makerFeeRate: '0.0002',
    minTradeNum: '0.001',
    openCostUpRatio: '0.01',
    priceEndStep: '5',
    pricePlace: '1',
    quoteCoin: 'USDT',
    sellLimitPriceRatio: '0.01',
    sizeMultiplier: '0.001',
    supportMarginCoins: ['USDT'],
    symbol: 'BTCUSDT_UMCBL',
    takerFeeRate: '0.0006',
    volumePlace: '3',
    symbolType: 'delivery',
    symbolStatus: 'normal',
    offTime: '-1',
    limitOpenTime: '-1',
    maintainTime: '',
    symbolName: 'SBTCSUSDT',
    maxOrderNum: '100',
    maxPositionNum: '100',
    minTradeUSDT: '10',
    ...symbolRules
})

export const createMockOrderWS = (order: object = {}) => ({
    symbol: 'BTCUSDT_UMCBL',
    orderId: '123456',
    fillSz: '0.01',
    sz: '0.01',
    lever: '10',
    fillPx: '10000',
    px: '10000',
})