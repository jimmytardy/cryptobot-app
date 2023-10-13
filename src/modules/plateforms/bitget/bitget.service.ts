import {
    Injectable,
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

    constructor(
        private bitgetUtilsService: BitgetUtilsService,
        private bitgetActionService: BitgetActionService,
    ) {
        this.client = {}
    }

    async initializeTraders(users: User[]) {
        for (const user of users) {
            this.addNewTrader(user);
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

    async placeOrder(placeOrderDTO: PlaceOrderDTO, userId: Types.ObjectId) {
        const userIdStr = userId.toString()
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
            const balance = await this.bitgetUtilsService.getAccountUSDT(
                this.client[userIdStr],
                marginCoin,
            )
            size = balance * 0.06
        }
        const fullSide = ('open_' + side) as FuturesOrderSide
        const linkOrderId = new Types.ObjectId()
        const results = {
            errors: [],
            success: [],
        }
        for (const PE of PEs) {
            try {
                results.success.push(
                    await this.bitgetActionService.placeOrder(
                        this.client[userIdStr],
                        userId,
                        symbolRules,
                        size,
                        fullSide,
                        PE,
                        TPs,
                        SL,
                        linkOrderId,
                    ),
                )
            } catch (error) {
                results.errors.push(error)
            }
        }
        return results
    }

    async activeOrder(orderId: string, userId: Types.ObjectId) {
        return await this.bitgetActionService.activeOrder(
            this.client[userId.toString()],
            orderId,
        )
    }

    async upgradeSL(order: Order): Promise<StopLoss> {
        return await this.bitgetActionService.upgradeSL(
            this.client[order.userId.toString()],
            order,
        )
    }
}
