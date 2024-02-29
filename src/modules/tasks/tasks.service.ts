import { Injectable, Logger, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common'
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
import _ from 'underscore'
import { PlateformsService } from '../plateforms/plateforms.service'
import { PaymentsService } from '../payment/payments.service'
import { SubscriptionEnum } from 'src/model/Subscription'
import { ErrorTraceService } from '../error-trace/error-trace.service'
import { ErrorTraceSeverity } from 'src/model/ErrorTrace'

@Injectable()
export class TasksService implements OnApplicationBootstrap, OnModuleInit {
    private readonly logger = new Logger(TasksService.name)

    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(Symbol.name) private symbolModel: Model<Symbol>,
        @InjectModel(AppConfig.name) private appConfigModel: Model<AppConfig>,
        private userService: UserService,
        private bitgetService: BitgetService,
        private paymentsService: PaymentsService,
        private errorTraceService: ErrorTraceService,
    ) {}

    async onModuleInit() {
        await this.synchroSubscriptions()
    }

    async onApplicationBootstrap() {
        await this.syncOrderSL()
        const symbol = await this.symbolModel.findOne({}, '+positionTier').exec()
        if (!symbol?.positionTier || symbol.positionTier.length === 0) {
            await this.updateSymbolRules()
        }
        await this.updateQuantity()
    }

    @Cron(CronExpression.EVERY_12_HOURS)
    async synchroSubscriptions() {
        const users = await this.userService.findAll()

        for (const user of users) {
            await this.paymentsService.actualizeSubscription(user)
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async syncOrderSL() {
        const appConfig = await this.appConfigModel.findOne()
        if (appConfig.syncOrdersBitget.active) {
            const orders = await this.orderModel.find({ terminated: false, activated: true }).exec()
            const currentPriceMemo: { [key: string]: number } = {}
            const request = []
            for (const order of orders) {
                if (!currentPriceMemo[order.symbol]) {
                    currentPriceMemo[order.symbol] = await this.bitgetService.getCurrentPrice('symbol', order.symbol)
                }
                request.push(
                    this.bitgetService
                        .synchronizeAllSL(order.userId, order.symbol, currentPriceMemo[order.symbol])
                        .catch((e) => this.errorTraceService.createErrorTrace('TaskService => syncOrderSL', order.userId, ErrorTraceSeverity.IMMEDIATE, { error: e, order })),
                )
            }
            await Promise.all(request)
        }
    }

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async updateQuantity() {
        const users = await this.userService.findAll({ 'preferences.order.automaticUpdate': true, 'subscription.active': true }, undefined, { lean: true })
        await Promise.all(
            users.map(async (user) => {
                const account = await this.bitgetService.getProfile(user._id)
                user.preferences.order.quantity = Math.ceil(account.available)
                await this.userService.updateOne(user)
            }),
        )
    }

    /**
     * Supprime les ordres qui ne sont pas activés mais qui ont déjà taper un TP
     */
    // @Cron(CronExpression.EVERY_10_MINUTES)
    // async cleanOrderNotTriggeredWhichTP() {
    //     try {
    //         const ordersToSend = await this.orderModel
    //             .find({
    //                 terminated: false,
    //                 activated: false,
    //             })
    //             .lean()
    //             .exec()

    //         const symbolData = {}

    //         const querys = []
    //         const timestampNow = Date.now()
    //         const candlesToFetch = 1
    //         const nbMin = 15
    //         const msPerCandle = 60 * 1000 * nbMin // 60 seconds x 1000 X nbMin
    //         const msFor1kCandles = candlesToFetch * msPerCandle
    //         const startTime = timestampNow - msFor1kCandles
    //         for (const order of ordersToSend) {
    //             if (!symbolData[order.symbol]) {
    //                 const client = this.bitgetService.getFirstClient()
    //                 const candles = await client.getCandles(
    //                     order.symbol,
    //                     (nbMin + 'm') as FuturesKlineInterval,
    //                     startTime.toString(),
    //                     timestampNow.toString(),
    //                     String(candlesToFetch),
    //                 )
    //                 if (candles && (candles.length <= 0 || candles[0].length < 4)) continue
    //                 symbolData[order.symbol] = {
    //                     max: parseFloat(candles[0][2]), // Highest price
    //                     min: parseFloat(candles[0][3]), // Lowest price
    //                 }
    //             }
    //             const createdAt = new Date(order.createdAt).getTime()
    //             // if order is older than nbMin minutes, continue
    //             if ((createdAt - timestampNow) / 1000 / 60 > nbMin) continue
    //             if ((order.side === 'long' && symbolData[order.symbol].max >= order.TPs[0]) || (order.side === 'short' && symbolData[order.symbol].min <= order.TPs[0])) {
    //                 querys.push(this.orderModel.updateOne({ _id: order._id }, { $set: { terminated: true } }))
    //             }
    //         }
    //         await Promise.all(querys)
    //     } catch (e) {
    //         this.logger.error('disableOrderNotSendWhichTP', e)
    //         console.error('e', e.stack)
    //         console.trace()
    //     }
    // }

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
