import { Types } from "mongoose"
import { Order } from "src/model/Order"

export const createMockOrder = (order: Partial<Order> = {}): Order => {
    return {
        _id: new Types.ObjectId(),
        symbol: 'BTCUSDT',
        quantity: 10,
        marginCoin: 'USDT',
        SL: 9000,
        side: 'long',
        userId: new Types.ObjectId(),
        activated: false,
        terminated: false,
        cancelled: false,
        clOrderId: new Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        inActivation: false,
        linkOrderId: new Types.ObjectId(),
        TPs: [],
        orderId: '12345',
        PE: 10000,
        usdt: 500,
        sendToPlateform: true,
        leverage: 50,
        steps: [],
        ...order
    }
}