import {
    HttpException,
    Injectable,
    Logger,
    OnApplicationBootstrap,
    OnModuleInit,
} from '@nestjs/common'
import { PlaceOrderDTO, SetLeverageDTO } from './bitget.dto'
import { ConfigService } from '@nestjs/config'
import { FuturesClient, FuturesOrderSide } from 'bitget-api'
import { BitgetActionService } from './bitget-action/bitget-action.service'
import { BitgetUtilsService } from './bitget-utils/bitget-utils.service'
import { Model, Types } from 'mongoose'
import { Order } from 'src/model/Order'
import { StopLoss } from 'src/model/StopLoss'
import { User } from 'src/model/User'
import { InjectModel } from '@nestjs/mongoose'
import { PaymentsService } from 'src/modules/payment/payments.service'
import { SubscriptionEnum } from 'src/model/Subscription'
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface'

@Injectable()
export class BitgetService {
    client: {
        [key: string]: FuturesClient
    }
    logger: Logger

    constructor(
        private bitgetUtilsService: BitgetUtilsService,
        private bitgetActionService: BitgetActionService,
        private paymentService: PaymentsService,
    ) {
        this.logger = new Logger('BitgetService')
        this.client = {}
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

    getFirstClient(): FuturesClient {
        return this.client[Object.keys(this.client)[0]]
    }

    getClient(userId: Types.ObjectId): FuturesClient {
        return this.client[userId.toString()]
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

    async placeOrder(
        placeOrderDTO: PlaceOrderDTO,
        user: User,
        linkParentOrderId?: Types.ObjectId,
    ): Promise<any> {
        const userIdStr = user._id.toString()
        let { PEs, SL, TPs, side, baseCoin, size } = placeOrderDTO
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
        const linkOrderId = linkParentOrderId || new Types.ObjectId()
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

        const currentPrice = await this.bitgetUtilsService.getCurrentPrice(
            this.client[userIdStr],
            symbolRules.symbol,
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
                        currentPrice,
                        linkOrderId,
                    ),
                )
            } catch (error) {
                results.errors.push({
                    ...error,
                    message: error.message,
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

    async activeOrder(orderId: Types.ObjectId, user: User) {
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

    async upgradeSL(
        order: Order,
        strategy: IOrderStrategy,
        numTP: number,
    ): Promise<StopLoss> {
        try {
            return await this.bitgetActionService.upgradeSL(
                this.client[order.userId.toString()],
                order,
                strategy,
                numTP,
            )
        } catch (e) {
            this.logger.error('upgradeSL', e)
        }
    }

    async cancelOrder(order: Order) {
        try {
            return await this.bitgetActionService.cancelOrder(
                this.client[order.userId.toString()],
                order.userId,
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
                userId,
            )
        } catch (e) {
            this.logger.error('disabledOrderLink', e)
        }
    }

    async setLeverage(user: User, leverageDTO: SetLeverageDTO) {
        const client = this.getClient(user._id)
        if (!client) {
            throw new HttpException('Client not found', 404)
        }
        const symbolRules = await this.bitgetUtilsService.getSymbolBy(client, 'baseCoin', leverageDTO.baseCoin);
        if (!symbolRules) throw new HttpException('Symbol not found', 404);

        try {
            return await this.bitgetActionService.setLeverage(
                this.getClient(user._id),
                user,
                symbolRules.symbol,
            )
        } catch (e) {
            this.logger.error('setLeverage', e)
        }
    }
}
