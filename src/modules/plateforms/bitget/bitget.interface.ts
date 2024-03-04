export interface IBitgetPosition {
    marginCoin: string;
    symbol: string;
    holdSide: 'long' | 'short';
    openDelegateSize: string;
    marginSize: string;
    available: string;
    locked: string;
    total: string;
    leverage: string;
    achievedProfits: string;
    openPriceAvg: string;
    marginMode: 'isolated' | 'crossed';
    posMode: 'hedge_mode';
    unrealizedPL: string;
    liquidationPrice: string;
    keepMarginRate: string;
    markPrice: string;
    marginRatio: string;
    cTime: string;
  }

  export interface IBitgetPlanOrder {
    planType: 'loss_plan' | 'profit_plan'; // Assuming 'profit_plan' might be another option
    symbol: string;
    size: string;
    orderId: string;
    clientOid: string;
    price: string;
    callbackRatio: string;
    triggerPrice: string;
    triggerType: 'fill_price' | 'market_price'; // Assuming 'market_price' might be another option
    planStatus: 'live' | 'cancelled' | 'executed'; // Added potential statuses
    side: 'buy' | 'sell';
    posSide: 'long' | 'short';
    marginCoin: string;
    marginMode: 'isolated' | 'cross' | ''; // Assuming '' could mean default or unspecified
    enterPointSource: 'API' | 'Manual'; // Assuming 'Manual' might be another option
    tradeSide: 'open' | 'close'; // Assuming 'open' could be an option
    posMode: 'hedge_mode'; // If there are more modes, they should be added similarly
    orderType: 'market' | 'limit'; // Assuming 'limit' might be another option
    stopSurplusTriggerPrice: string | null;
    stopSurplusExecutePrice: string | null;
    stopSurplusTriggerType: string | null; // Type based on system's implementation, assuming string for placeholder
    stopLossTriggerPrice: string;
    stopLossExecutePrice: string | null;
    stopLossTriggerType: 'fill_price' | 'market_price'; // Assuming 'market_price' might be another option
    cTime: string;
    uTime: string;
  }