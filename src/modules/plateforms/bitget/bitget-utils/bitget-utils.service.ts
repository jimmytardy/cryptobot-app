import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FuturesClient, FuturesSymbolRule, SymbolRules } from 'bitget-api'
import BaseRestClient from 'bitget-api/lib/util/BaseRestClient'
import { Model, Types } from 'mongoose'
import { TPSizeType, User } from 'src/model/User'
import { OrderService } from 'src/modules/order/order.service'
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
        const accountFuture = await this.getAccount(client)
        
        const result = {
            available: Number(accountFuture.available),
            totalPnL:
                Number(accountFuture.usdtEquity) -
                Number(accountFuture.unrealizedPL),
            unrealizedPL: Number(accountFuture.unrealizedPL),
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
        if (quantity < parseFloat(symbolRules.minTradeNum)) return 0;
        const sizeMultiplier = parseFloat(symbolRules.sizeMultiplier);
        if (quantity % sizeMultiplier === 0) {
            return Math.max(quantity, 0);
          } else {
            // calculer la décimal la plus faible du multiplicateur
            if (sizeMultiplier < 1) {
                const multiplierDecimalPlaces = (sizeMultiplier.toString().split('.')[1] || '').length;
                const roundedQuantity = Number(quantity.toFixed(multiplierDecimalPlaces));
                const newQuantity = Math.floor(roundedQuantity / sizeMultiplier) * sizeMultiplier;
                // Calculer le multiple précédent inférieur à quantity avec le même nombre de décimales que le multiplicateur
                return Number((Math.floor(roundedQuantity / sizeMultiplier) * sizeMultiplier).toFixed(multiplierDecimalPlaces))
            }
            // Calculer le multiple précédent inférieur à quantity
            return Math.floor(quantity / sizeMultiplier) * sizeMultiplier
          }
    }

    async getQuantityForOrder(client: FuturesClient, user: User) {
        let { quantity, pourcentage } = user.preferences.order || {}
        if (!quantity) {
            const account = await this.getAccount(client)
            quantity = account.usdtEquity
        }
        if (!pourcentage) {
            pourcentage = this.DEFAULT_PERCENTAGE_ORDER
        }
        return quantity * (pourcentage / 100)
    }

    caculateTPsToUse(
        tps: number[],
        size: number,
        TPSize: TPSizeType,
        symbolRules: FuturesSymbolRule,
    ): number[] {
        const newTps: number[] = [...tps];
        while(newTps.length > 0) {
            const TPSizeValue = TPSize[newTps.length];
            let value0Find = false;
            for (const tpSize of TPSizeValue) {
                const sizeTP = this.fixSizeByRules(
                    size * tpSize,
                    symbolRules,
                );
                if (sizeTP <= 0) {
                    value0Find= true;
                    break;
                }
            }
            if (!value0Find) {
                break;
            } else {
                newTps.pop();
            }
        }
        return newTps;
    }

    getLeverage(user: User, price: number) {
        let levierSelect = user.preferences.order.levierSize[0]
        for (const levierSetting of user.preferences.order.levierSize) {
            if (
                levierSelect.minPrice < levierSetting.minPrice &&
                levierSetting.minPrice < price
            ) {
                levierSelect = levierSetting
            }
        }
        return levierSelect.value
    }
}
