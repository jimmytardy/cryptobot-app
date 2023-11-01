import {
    Injectable,
    Logger,
    OnApplicationBootstrap,
    OnModuleInit,
} from '@nestjs/common'
import { PlaceOrderDTO } from './bitget.dto'
import { ConfigService } from '@nestjs/config'
import { FuturesClient, FuturesOrderSide } from 'bitget-api'
import { BitgetActionService } from './bitget-action/bitget-action.service'
import { BitgetUtilsService } from './bitget-utils/bitget-utils.service'
import { Types } from 'mongoose'
import { Order } from 'src/model/Order'
import { TakeProfit } from 'src/model/TakeProfit'
import { StopLoss } from 'src/model/StopLoss'
import { UserService } from 'src/modules/user/user.service'
import { User } from 'src/model/User'
import { BitgetWsService } from './bitget-ws/bitget-ws.service'

@Injectable()
export class BitgetService {
    client: {
        [key: string]: FuturesClient
    }
    logger: Logger

    constructor(
        private bitgetUtilsService: BitgetUtilsService,
        private bitgetActionService: BitgetActionService,
    ) {
        this.logger = new Logger('BitgetService')
        this.client = {}
    }

    async initializeTraders(users: User[]) {
        for (const user of users) {
            this.addNewTrader(user)
        }
    }

    addNewTrader(user: User) {
        if (!this.client[user._id.toString()]) {
            this.client[user._id.toString()] = new FuturesClient({
                apiKey: user.bitget.api_key,
                apiSecret: user.bitget.api_secret_key,
                apiPass: user.bitget.api_pass,
            })
        }
    }

    async getProfile(userId: Types.ObjectId) {
        return await this.bitgetUtilsService.getProfile(
            this.client[userId.toString()],
        )
    }

    async getBaseCoins(userId: Types.ObjectId) {
        return await this.bitgetUtilsService.getBaseCoins(
            this.client[userId.toString()],
        )
    }

    async placeOrder(placeOrderDTO: PlaceOrderDTO, user: User) {
        const userIdStr = user._id.toString()
        let {
            PEs,
            SL,
            TPs,
            side,
            baseCoin,
            size,
            marginCoin = 'USDT',
        } = placeOrderDTO
        const symbolRules = await this.bitgetUtilsService.getSymbolBy(
            this.client[userIdStr],
            'baseCoin',
            baseCoin,
        )
        if (!symbolRules) {
            return
        }
        if (!size) {
            size = await this.bitgetUtilsService.getQuantityForOrder(
                this.client[userIdStr],
                user,
            )
        }
        const fullSide = ('open_' + side) as FuturesOrderSide
        const linkOrderId = new Types.ObjectId()
        const results = {
            errors: [],
            success: [],
        }

        const peAvg = PEs.reduce((a, b) => a + b, 0) / PEs.length
        const leverage = await this.bitgetActionService.setLeverage(
            this.client[userIdStr],
            user,
            symbolRules.symbol,
            peAvg,
        )

        for (const PE of PEs) {
            try {
                results.success.push(
                    await this.bitgetActionService.placeOrder(
                        this.client[userIdStr],
                        user,
                        symbolRules,
                        size,
                        fullSide,
                        PE,
                        TPs,
                        SL,
                        leverage,
                        linkOrderId,
                    ),
                )
            } catch (error) {
                results.errors.push({
                    ...error,
                    userId: user._id,
                    symbolRules,
                    size,
                    fullSide,
                    PE,
                    TPs,
                    SL,
                    leverage,
                    linkOrderId,
                })
            }
        }
        return results
    }

    async activeOrder(orderId: string, user: User) {
        try {
            return await this.bitgetActionService.activeOrder(
                this.client[user._id.toString()],
                user,
                orderId,
            )
        } catch (e) {
            this.logger.error('activeOrder', e)
        }
    }

    async upgradeSL(order: Order): Promise<StopLoss> {
        console.log('upgradeSL order', order)
        try {
            return await this.bitgetActionService.upgradeSL(
                this.client[order.userId.toString()],
                order,
            )
        } catch (e) {
            this.logger.error('upgradeSL', e)
        }
    }

    async cancelOrder(order: Order) {
        try {
            return await this.bitgetActionService.cancelOrder(
                this.client[order.userId.toString()],
                order,
            )
        } catch (e) {
            this.logger.error('removeOrder', e)
        }
    }

    async disabledOrderLink(userId: Types.ObjectId, linkId: Types.ObjectId) {
        try {
            await this.bitgetActionService.disabledOrderLink(
                this.client[userId.toString()],
                linkId,
            )
        } catch (e) {
            this.logger.error('disabledOrderLink', e)
        }
    }
}
