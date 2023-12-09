import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import {
    FuturesClient,
    FuturesHoldSide,
    FuturesProductType,
    FuturesSymbolRule,
    SymbolRules,
} from 'bitget-api'
import { Order } from 'src/model/Order'
import { TPSizeType, User } from 'src/model/User';
import * as math from 'exact-math';

@Injectable()
export class BitgetUtilsService {
    DEFAULT_PERCENTAGE_ORDER = 4
    PRODUCT_TYPE: FuturesProductType = 'umcbl'
    constructor(
        configService: ConfigService,
    ) {
        if (configService.get('ENV') === 'dev') {
            this.PRODUCT_TYPE = 'sumcbl';
        }
    }

    async getAccount(client: FuturesClient): Promise<any> {
        const account = await client.getAccounts(this.PRODUCT_TYPE)
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
        return Number.parseFloat((await client.getMarkPrice(symbol)).data.markPrice);
    }

    async getBaseCoins(client: FuturesClient): Promise<string[]> {
        const result = await client.getSymbols(this.PRODUCT_TYPE)
        const coins = result.data.map((currentCoin) => currentCoin.baseCoin)
        return coins
    }

    async getSymbolBy(
        client: FuturesClient,
        key: string,
        value: string | number,
    ): Promise<FuturesSymbolRule> {
        const result = await client.getSymbols(this.PRODUCT_TYPE)
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
        const sizeMultiplier = parseFloat(symbolRules.sizeMultiplier)
        if (quantity % sizeMultiplier === 0) {
            return Math.max(quantity, 0)
        } else {
            // calculer la décimal la plus faible du multiplicateur
            if (sizeMultiplier < 1) {
                const multiplierDecimalPlaces = (
                    sizeMultiplier.toString().split('.')[1] || ''
                ).length
                const roundedQuantity = Number(
                    quantity.toFixed(multiplierDecimalPlaces),
                )
                // Calculer le multiple précédent inférieur à quantity avec le même nombre de décimales que le multiplicateur
                return parseFloat(
                    (
                        Math.floor(roundedQuantity / sizeMultiplier) *
                        sizeMultiplier
                    ).toFixed(multiplierDecimalPlaces),
                )
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

    convertSymbolToV2(symbol: string): string {
        return symbol.split('_')[0]
    }

    caculateTPsToUse(
        tps: number[],
        size: number,
        TPSize: TPSizeType,
        symbolRules: FuturesSymbolRule,
        sideOrder: FuturesHoldSide,
    ): { TPPrice: number[], TPSize: number[] } {
        const newTps: number[] = [...tps];
        let TPSizeCalculate: number[] = [];
        while (newTps.length > 0) {
            let totalSize = 0;
            TPSizeCalculate = []
            const TPSizeMultpliers = TPSize[newTps.length]
            let TPListWrong = false;
            if (TPSizeMultpliers) {
                for (let i = 0; i < TPSizeMultpliers.length; i++) {
                    const TPMultiplier = TPSizeMultpliers[i]
                    const isLast = i === TPSizeMultpliers.length - 1;
                    let currentSize = 0;
                    if (isLast) {
                        currentSize = math.sub(size, totalSize);
                    } else {
                        currentSize = math.mul(TPMultiplier, size);
                    }
                    const sizeTP = this.fixSizeByRules(currentSize, symbolRules);
                    TPSizeCalculate.push(sizeTP);
                    totalSize = math.add(totalSize, sizeTP);
                    if (sizeTP <= 0 || totalSize > size) {
                        TPListWrong = true
                        break
                    }
                }
            } else TPListWrong = true;
            if (!TPListWrong && totalSize === size) {
                break;
            } else {
                newTps.pop()
            }
        }

        return {
            TPPrice: sideOrder === 'long' ? newTps.sort() : newTps.sort().reverse(),
            TPSize: TPSizeCalculate,
        }
    }

    getLeverage(user: User, price: number) {
        let levierSelect = user.preferences.order.levierSize[0];
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

    canSendBitget(
        symbolRules: FuturesSymbolRule,
        currentPrice: number,
        order: Order,
    ) {
        const buyLimitPriceRatio = Number(symbolRules.buyLimitPriceRatio)
        const sellLimitPriceRatio = Number(symbolRules.sellLimitPriceRatio)
        // is in intervalle fixed by rules
        return (
            (order.side === 'long' &&
                order.PE < currentPrice + currentPrice * buyLimitPriceRatio &&
                order.PE > currentPrice - currentPrice * buyLimitPriceRatio &&
                order.SL < currentPrice) ||
            (order.side === 'short' &&
                order.PE > currentPrice - currentPrice * sellLimitPriceRatio &&
                order.PE < currentPrice + currentPrice * sellLimitPriceRatio &&
                order.SL > currentPrice)
        )
    }
}
