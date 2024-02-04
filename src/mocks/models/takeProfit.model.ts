import { Types } from "mongoose"
import { TakeProfit } from "src/model/TakeProfit"

export const createMockTakeProfit = (takeProfit: Partial<TakeProfit> = {}): TakeProfit => {
    return {
        _id: new Types.ObjectId(),
        terminated: false,
        activated: true,
        cancelled: false,
        clOrderId: new Types.ObjectId(),
        marginCoin: 'USDT',
        orderId: '12345',
        num: 1,
        orderParentId: new Types.ObjectId(),
        PnL: 0,
        quantity: 10,
        side: 'long',
        symbol: 'BTCUSDT',
        triggerPrice: 10000,
        userId: new Types.ObjectId(),
        updated: false,
        ...takeProfit
    }
}