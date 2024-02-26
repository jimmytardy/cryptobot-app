import { Types } from "mongoose"
import { StopLoss } from "src/model/StopLoss"

export const createMockStopLoss = (stopLoss: Partial<StopLoss> = {}): StopLoss => {
    return {
        _id: new Types.ObjectId(),
        clOrderId: new Types.ObjectId(),
        historyTrigger: [],
        orderId: '12345',
        orderParentId: new Types.ObjectId(),
        step: 0,
        symbol: 'BTCUSDT',
        terminated: false,
        triggerPrice: 10000,
        activated: true,
        cancelled: false,
        updated: false,
        userId: new Types.ObjectId(),
        side: 'long',
        marginCoin: 'USDT',
        quantity: 0.1,
        PnL: 0,
        ...stopLoss
    }
}