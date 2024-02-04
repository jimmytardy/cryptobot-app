import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/mongoose'
import { Order } from 'src/model/Order'
import { Model, Types } from 'mongoose'
import { BitgetUtilsService } from '../plateforms/bitget/bitget-utils/bitget-utils.service'
import { BitgetService } from '../plateforms/bitget/bitget.service'
import { FuturesClient, FuturesKlineInterval } from 'bitget-api'
import { UserService } from '../user/user.service'
import { Symbol } from 'src/model/Symbol'
import * as exactMath from 'exact-math'
import { AppConfig } from 'src/model/AppConfig'

@Injectable()
export class TasksService implements OnApplicationBootstrap {
    private readonly logger = new Logger(TasksService.name)

    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(Symbol.name) private symbolModel: Model<Symbol>,
        @InjectModel(AppConfig.name) private appConfigModel: Model<AppConfig>,
        private userService: UserService,
        private bitgetUtilsService: BitgetUtilsService,
        private bitgetService: BitgetService,
    ) {}

    async onApplicationBootstrap() {
        const symbol = await this.symbolModel.findOne({}, '+positionTier').exec()
        if (!symbol?.positionTier || symbol.positionTier.length === 0) {
            await this.updateSymbolRules()
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async syncOrders() {
        const appConfig = await this.appConfigModel.findOne()
        if (appConfig.syncOrdersBitget.active) {
            const now = Date.now()
            const users = await this.userService.getListOfTraders()
            for (const user of users) {
                const client = this.bitgetService.getClient(user._id)
                const symbols = await this.orderModel.distinct('symbol', { userId: user._id }).exec()
                for (const symbol of symbols) {
                    const ordersBitget = await client.getOrderHistory(symbol, String(appConfig.syncOrdersBitget.lastUpdated), String(now), '10')
                    if (ordersBitget.data.orderList) {
                        for (const orderBitget of ordersBitget.data.orderList) {
                            if (!Types.ObjectId.isValid(orderBitget.clientOid)) continue
                            const order = await this.orderModel.findOne({ clOrderId: new Types.ObjectId(orderBitget.clientOid) }).exec()
                            if (!order) continue
                            order.PE = orderBitget.price || orderBitget.priceAvg
                            order.usdt = exactMath.round(exactMath.mul(orderBitget.size, order.PE) / order.leverage, -3)
                            await order.save()
                        }
                    }
                }
            }
            appConfig.syncOrdersBitget.lastUpdated = now
            await appConfig.save()
        }
    }

    /**
     * Supprime les ordres qui ne sont pas activés mais qui ont déjà taper un TP
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async cleanOrderNotTriggeredWhichTP() {
        try {
            const ordersToSend = await this.orderModel
                .find({
                    terminated: false,
                    activated: false,
                })
                .lean()
                .exec()

            const symbolData = {}

            const querys = []
            const timestampNow = Date.now()
            const candlesToFetch = 1
            const nbMin = 15
            const msPerCandle = 60 * 1000 * nbMin // 60 seconds x 1000 X nbMin
            const msFor1kCandles = candlesToFetch * msPerCandle
            const startTime = timestampNow - msFor1kCandles
            for (const order of ordersToSend) {
                if (!symbolData[order.symbol]) {
                    const client = this.bitgetService.getFirstClient()
                    const candles = await client.getCandles(
                        order.symbol,
                        (nbMin + 'm') as FuturesKlineInterval,
                        startTime.toString(),
                        timestampNow.toString(),
                        String(candlesToFetch),
                    )
                    if (candles && (candles.length <= 0 || candles[0].length < 4)) continue
                    symbolData[order.symbol] = {
                        max: parseFloat(candles[0][2]), // Highest price
                        min: parseFloat(candles[0][3]), // Lowest price
                    }
                }
                const createdAt = new Date(order.createdAt).getTime()
                // if order is older than nbMin minutes, continue
                if ((createdAt - timestampNow) / 1000 / 60 > nbMin) continue
                if ((order.side === 'long' && symbolData[order.symbol].max >= order.TPs[0]) || (order.side === 'short' && symbolData[order.symbol].min <= order.TPs[0])) {
                    querys.push(this.orderModel.updateOne({ _id: order._id }, { $set: { terminated: true } }))
                }
            }
            await Promise.all(querys)
        } catch (e) {
            this.logger.error('disableOrderNotSendWhichTP', e)
            console.error('e', e.stack)
            console.trace()
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async updateSymbolRules() {
        const client = this.bitgetService.getFirstClient()
        const symbols = await client.getSymbols(BitgetService.PRODUCT_TYPE)
        if (!symbols.data) return

        await this.symbolModel.deleteMany({}).exec() 
        await this.updatePositionTierAndInsert(client, symbols.data as Symbol[], 0)
    }

    async updatePositionTierAndInsert(client: FuturesClient, symbols: Symbol[], index: number) {
        try {
            if (index >= symbols.length) return
            const symbol = symbols[index]
            const newPositionTier = await client.getPositionTier(symbol.symbol, BitgetService.PRODUCT_TYPE)
            symbol.positionTier = newPositionTier.data.map((tier: any) => ({
                ...tier,
                keepMarginRate: parseFloat(tier.keepMarginRate),
            }))
            await this.symbolModel.insertMany(symbol)
            this.updatePositionTierAndInsert(client, symbols, index + 1)
        } catch (e) {
            this.logger.error('updatePositionTierAndInsert', e)
        }
    }
}
