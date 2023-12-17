import {
    HttpException,
    Injectable,
    Logger,
    OnApplicationBootstrap,
    OnModuleInit,
} from '@nestjs/common'
import { PlaceOrderDTO, SetLeverageDTO } from './bitget.dto'
import { ConfigService } from '@nestjs/config'
import { FuturesClient, FuturesOrderSide, RestClientV2 } from 'bitget-api'
import { BitgetActionService } from './bitget-action/bitget-action.service'
import { BitgetUtilsService } from './bitget-utils/bitget-utils.service'
import { Model, Types } from 'mongoose'
import { Order, OrderDocument } from 'src/model/Order'
import { StopLoss } from 'src/model/StopLoss'
import { User } from 'src/model/User'
import { InjectModel } from '@nestjs/mongoose'
import { PaymentsService } from 'src/modules/payment/payments.service'
import { SubscriptionEnum } from 'src/model/Subscription'
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface'
import { IArrayModification } from 'src/util/util.interface'
import { IOrderUpdate } from './bitget-action/bitget-action.interface'
import { UtilService } from 'src/util/util.service'

@Injectable()
export class BitgetService {
    client: {
        [key: string]: FuturesClient
    }
    clientV2: {
        [key: string]: RestClientV2
    }
    logger: Logger

    constructor(
        private bitgetUtilsService: BitgetUtilsService,
        private bitgetActionService: BitgetActionService
    ) {
        this.logger = new Logger('BitgetService')
        this.client = {}
        this.clientV2 = {}
    }

    addNewTrader(user: User) {
        if (!this.client[user._id.toString()]) {
            this.client[user._id.toString()] = new FuturesClient({
                apiKey: user.bitget.api_key,
                apiSecret: user.bitget.api_secret_key,
                apiPass: user.bitget.api_pass,
            })
        }
        if (!this.clientV2[user._id.toString()]) {
            this.clientV2[user._id.toString()] = new RestClientV2({
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

    getClientV2(userId: Types.ObjectId): RestClientV2 {
        return this.clientV2[userId.toString()]
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

    async getQuantityForOrder(user: User) {
        return await this.bitgetUtilsService.getQuantityForOrder(
            this.client[user._id.toString()],
            user
        )
    }

    async placeOrder(
        placeOrderDTO: PlaceOrderDTO,
        user: User,
        linkParentOrderId?: Types.ObjectId,
    ): Promise<any> {
        const userIdStr = user._id.toString()
        let { PEs, SL, TPs, side, baseCoin, size: usdtSizeDTO } = placeOrderDTO;
        const symbolRules = await this.bitgetUtilsService.getSymbolBy(
            this.client[userIdStr],
            'baseCoin',
            baseCoin,
        )
        if (!symbolRules) {
            return
        }
        const usdtSize = usdtSizeDTO || await this.getQuantityForOrder(user);

        const client = this.getClient(user._id);

        PEs = UtilService.sortBySide(PEs, side);
        TPs = UtilService.sortBySide(TPs, side);
        const profile = await this.bitgetUtilsService.getProfile(client);
        if (profile.available < usdtSize * PEs.length) {
            while (Math.max(profile.available, 0) <= usdtSize * PEs.length) {
                PEs.shift();
            }
            if (PEs.length === 0) {
                throw new HttpException('Fonds insuffisants pour poser un ordre', 400);
            }
        }
        const fullSide = ('open_' + side) as FuturesOrderSide
        const linkOrderId = linkParentOrderId || new Types.ObjectId()
        const results = {
            errors: [],
            success: [],
        }

        const peAvg = PEs.reduce((a, b) => a + b, 0) / PEs.length
        const leverage = await this.bitgetActionService.setLeverageWithPreference(
            this.client[userIdStr],
            user,
            symbolRules.symbol,
            peAvg,
        )

        const currentPrice = await this.bitgetUtilsService.getCurrentPrice( 
            this.client[userIdStr],
            symbolRules.symbol,
        )

        await this.setLeverageWithPreference(user, {
            baseCoin,
        })

        await Promise.all(
            PEs.map(async (pe) => {
                const PECalculate = this.bitgetUtilsService.fixPriceByRules(pe, symbolRules);
                try {
                    results.success.push(
                        await this.bitgetActionService.placeOrder(
                            this.client[userIdStr],
                            user,
                            symbolRules,
                            usdtSize,
                            fullSide,
                            PECalculate,
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
                        usdtSize,
                        fullSide,
                        originalPE: pe,
                        PECalculate,
                        TPs,
                        SL,
                        leverage,
                        linkOrderId,
                    })
                }
            }),
        )
        return results
    }

    async activeOrder(orderId: Types.ObjectId, user: User) {
        try {
            return await this.bitgetActionService.activeOrder(
                this.client[user._id.toString()],
                orderId,
                user,
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

    async closePosition(symbol: string, userId: Types.ObjectId) {
        try {
            const client = this.getClientV2(userId);
            return await this.bitgetActionService.closePosition(
                client,
                userId,
                symbol,
            )
        } catch (e) {
            this.logger.error('cancelSymbol', e)
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

    async disabledOrderLink(linkId: Types.ObjectId, userId: Types.ObjectId) {
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

    async setLeverageWithPreference(user: User, leverageDTO: SetLeverageDTO) {
        const client = this.getClient(user._id)
        if (!client) {
            throw new HttpException('Client not found', 404)
        }
        const symbolRules = await this.bitgetUtilsService.getSymbolBy(client, 'baseCoin', leverageDTO.baseCoin);
        if (!symbolRules) throw new HttpException('Symbol not found', 404);

        try {
            return await this.bitgetActionService.setLeverageWithPreference(
                this.getClient(user._id),
                user,
                symbolRules.symbol,
            )
        } catch (e) {
            this.logger.error('setLeverageWithPreference', e)
        }
    }

    async updateOrderPE(order: OrderDocument, newPE: number): Promise<boolean> {
        try {
            return await this.bitgetActionService.updateOrderPE(
                this.getClient(order.userId),
                order,
                newPE,
            )
        } catch (e) {
            this.logger.error('updateOrderPE', e)
        }
    }

    async updateTPsOfOrder(order: OrderDocument, newTPs: number[], user?: User): Promise<boolean> {
        try {
            return await this.bitgetActionService.updateTPsOfOrder(
                this.getClient(order.userId),
                order,
                newTPs,
                user
            )
        } catch (e) {
            this.logger.error('updateTPsOfOrder', e)
        }
    }
    
    async updateOrderSL(order: OrderDocument, newSL: number): Promise<boolean> {
        try {
            return await this.bitgetActionService.updateOrderSL(
                this.getClient(order.userId),
                order,
                newSL,
            )
        } catch (e) {
            this.logger.error('updateOrderSL', e)
        }
    }
}
