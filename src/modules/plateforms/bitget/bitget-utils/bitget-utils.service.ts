import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FuturesClient, FuturesSymbolRule } from 'bitget-api'
import { Model, Types } from 'mongoose'
import { User } from 'src/model/User'
import { UserService } from 'src/modules/user/user.service'

@Injectable()
export class BitgetUtilsService {
    DEFAULT_PERCENTAGE_ORDER = 4
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
    ) {}

    async getAccount(client: FuturesClient): Promise<any> {
        const account = await client.getAccounts('umcbl')
        // const balances = allBalances.filter((bal) => Number(bal.available) != 0);
        return account.data[0]
    }

    async getProfile(client: FuturesClient): Promise<any> {
        const [accountFuture, positions] = await Promise.all([
            this.getAccount(client),
            await client.getPositionsV2('umcbl'),
        ])

        const fullPositions = []
        for (const position of positions.data) {
            fullPositions.push({
                leverage: position.leverage,
                baseCoin: position.symbol.replace('USDT_UMCBL', ''),
                margin: Number(position.margin),
                holdSide: position.holdSide,
            });
        }

        const result = {
            available: Number(accountFuture.available),
            totalPnL:
                Number(accountFuture.usdtEquity) -
                Number(accountFuture.unrealizedPL),
            unrealizedPL: Number(accountFuture.unrealizedPL),
            positions: fullPositions,
        }
        return result
    }

    async getCurrentPrice(
        client: FuturesClient,
        symbol: string,
    ): Promise<number> {
        const candlesToFetch = 1
        const timestampNow = Date.now()
        const msPerCandle = 60 * 1000 // 60 seconds x 1000
        const msFor1kCandles = candlesToFetch * msPerCandle
        const startTime = timestampNow - msFor1kCandles

        const candles = await client.getCandles(
            symbol,
            '1m',
            startTime.toString(),
            timestampNow.toString(),
            String(candlesToFetch),
        )
        return Number.parseFloat(candles[candles.length - 1][4])
    }

    async getBaseCoins(client: FuturesClient): Promise<string[]> {
        const result = await client.getSymbols('umcbl')
        const coins = result.data.map((currentCoin) => currentCoin.baseCoin)
        return coins
    }

    async getSymbolBy(
        client: FuturesClient,
        key: string,
        value: string | number,
    ): Promise<FuturesSymbolRule> {
        const result = await client.getSymbols('umcbl')
        const coin = result.data.find(
            (currentCoin) => currentCoin[key] == value,
        )
        return coin
    }

    getQuantityForUSDT(
        usdt: number,
        coinPrice: number,
        leverage: number,
    ): number {
        return (usdt / coinPrice) * leverage
    }

    fixSizeByRules(quantity: number, symbolRules: FuturesSymbolRule) {
        const replaceAt = function (
            str: string,
            index: number,
            replacement: string,
        ) {
            return (
                str.substring(0, index) +
                replacement +
                str.substring(index + replacement.length)
            )
        }

        const sizeMultiplier = parseFloat(symbolRules.sizeMultiplier)
        var decimal =
            sizeMultiplier.toString().split('.').length > 1
                ? sizeMultiplier.toString().split('.')[1].length
                : 0

        let value: string = (
            Math.round(quantity / sizeMultiplier) * sizeMultiplier
        ).toFixed(decimal + 1)
        // arrondir au dessus
        if (value[value.length - 1] !== '0') {
            const indexChar = value[value.length - 2] === '0' ? -2 : -3
            value = replaceAt(
                value,
                indexChar,
                '' + (parseInt(value[indexChar]) + 1),
            )
        }
        value = value.slice(0, -1)
        return parseFloat(value)
    }

    formatNumberByRules(number: number, symbolRules: FuturesSymbolRule) {
        number = Math.round(
            number * Math.pow(10, Number.parseInt(symbolRules.pricePlace)),
        )
        number = number - (number % Number.parseInt(symbolRules.priceEndStep))
        number = number / Math.pow(10, Number.parseInt(symbolRules.pricePlace))
        return number
    }

    async getQuantityForOrder(client: FuturesClient, userId: string) {
        const user = await this.userModel.findById(userId, 'orderConfig')
        if (!user) return 0
        let { quantity, pourcentage } = user.orderConfig || {}
        if (!quantity) {
            const account = await this.getAccount(client)
            quantity = account.usdtEquity
        }
        if (!pourcentage) {
            pourcentage = this.DEFAULT_PERCENTAGE_ORDER
        }
        return quantity * (pourcentage / 100)
    }
}
