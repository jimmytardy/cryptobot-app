export interface IOrderEventData {
    accBaseVolume: string
    baseVolume: string
    cTime: string
    clientOid: string
    enterPointSource: string
    feeDetail: any[] // Type précis à spécifier selon le contenu réel
    fillFee: string
    fillFeeCoin: string
    fillNotionalUsd: string
    fillPrice: string
    fillTime: string
    force: string
    instId: string
    leverage: string
    marginCoin: string
    marginMode: string
    notionalUsd: string
    orderId: string
    orderType: 'limit' | 'market'
    pnl: string
    posMode: string
    posSide: string
    price: string
    priceAvg: string
    reduceOnly: string
    side: string
    size: string
    status: 'filled' | 'canceled' | 'partially_filled' | 'live'
    tradeId: string
    tradeScope: string
    tradeSide: string
    uTime: string
}

export interface IOrderAlgoEventData {
    instId: string
    orderId: string
    clientOid: string
    triggerPrice: string
    triggerType: string
    triggerTime: string
    planType: string
    price: string
    size: string
    actualSize: string
    orderType: string
    side: string
    tradeSide: string
    posSide: string
    marginCoin: string
    status: 'executed' | 'cancelled' | 'executing' | 'live' | 'fail_execute'
    posMode: string
    enterPointSource: string
    stopSurplusTriggerType: string
    stopLossTriggerType: string
    cTime: string
    uTime: string
}

export type EnterPointSourceType = 'WEB' | 'API' | 'SYS' | 'ANDROID' | 'IOS'
