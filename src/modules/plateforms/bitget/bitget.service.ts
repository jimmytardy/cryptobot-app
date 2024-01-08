import {
    HttpException,
    Injectable,
    Logger,
    OnApplicationBootstrap,
} from '@nestjs/common'
import { PlaceOrderDTO } from './bitget.dto'
import { FuturesClient, FuturesOrderSide, RestClientV2 } from 'bitget-api'
import { BitgetActionService } from './bitget-action/bitget-action.service'
import { BitgetUtilsService } from './bitget-utils/bitget-utils.service'
import { ProjectionType, Types } from 'mongoose'
import { Order, OrderDocument } from 'src/model/Order'
import { StopLoss } from 'src/model/StopLoss'
import { User } from 'src/model/User'
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface'
import { UtilService } from 'src/util/util.service'
import { AppConfigService } from 'src/modules/app-config/app-config.service'
import { Symbol } from 'src/model/Symbol'

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
        private bitgetActionService: BitgetActionService,
        private appConfig: AppConfigService
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

    async getLeverageLimit(baseCoin: string) {
        return await this.bitgetUtilsService.getLeverageLimit(
            this.getFirstClient(),
            'baseCoin',
            baseCoin
        )
    }

    async getSymbolBy(key: string, value: string | number, select?: ProjectionType<Symbol>): Promise<Symbol> {
        return await this.bitgetUtilsService.getSymbolBy(key, value, select)
    }

    async getCurrentPrice(key: string, value: string | number) {
        const symbol = await this.bitgetUtilsService.getSymbolBy(key, value)
        return await this.bitgetUtilsService.getCurrentPrice(
            this.getFirstClient(),
            symbol.symbol,
        )
    }

    async placeOrder(
        placeOrderDTO: PlaceOrderDTO,
        user: User,
        linkParentOrderId?: Types.ObjectId,
        currentPrice: number = null,
    ): Promise<any> {
        let { PEs, SL, TPs, side, baseCoin, size: margin } = placeOrderDTO;
        const symbolRules = await this.bitgetUtilsService.getSymbolBy(
            'baseCoin',
            baseCoin,
            '+positionTier'
        )
        if (!symbolRules) {
            return
        }
        const client = this.getClient(user._id);

        PEs = UtilService.sortBySide(PEs, side);
        TPs = UtilService.sortBySide(TPs, side);
        if (!margin) margin = await this.getQuantityForOrder(user);
        const profile = await this.bitgetUtilsService.getProfile(client);
        if (profile.available < margin * PEs.length) {
            while (Math.max(profile.available, 0) <= margin * PEs.length) {
                PEs.shift();
            }
            if (PEs.length === 0) {
                throw new HttpException('Fonds insuffisants pour poser un ordre', 400);
            }
        }
        const fullSide = ('open_' + side) as FuturesOrderSide
        const linkOrderId = linkParentOrderId || new Types.ObjectId()
        const PEAvg = PEs.reduce((a, b) => a + b, 0) / PEs.length
        const leverage = this.bitgetUtilsService.calculateLeverage(PEAvg, margin * PEs.length, SL, symbolRules, side)
        const size = this.bitgetUtilsService.fixSizeByRules(this.bitgetUtilsService.getQuantityForUSDT(margin, PEAvg, leverage), symbolRules);
        if (!currentPrice) currentPrice = await this.bitgetUtilsService.getCurrentPrice(client, symbolRules.symbol);
        const results = {
            errors: [],
            success: [],
        }
        await this.bitgetActionService.setMarginMode(client, symbolRules.symbol);
        await this.bitgetActionService.setLeverage(client, symbolRules.symbol, leverage);
        await Promise.all(
            PEs.map(async (pe) => {
                const PECalculate = this.bitgetUtilsService.fixPriceByRules(pe, symbolRules);
                
                try {
                    results.success.push(
                        await this.bitgetActionService.placeOrder(
                            client,
                            user,
                            symbolRules,
                            fullSide,
                            PECalculate,
                            TPs,
                            SL,
                            size,
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

    async activeOrder(orderId: Types.ObjectId, user: User, orderEvent: any) {
        try {
            return await this.bitgetActionService.activeOrder(
                this.client[user._id.toString()],
                orderId,
                user,
                orderEvent
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
