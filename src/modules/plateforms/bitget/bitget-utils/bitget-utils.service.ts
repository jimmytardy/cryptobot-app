import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FuturesClient, FuturesHoldSide, FuturesSymbolRule } from 'bitget-api'
import { Order } from 'src/model/Order'
import { TPSizeType, User } from 'src/model/User'
import * as exactMath from 'exact-math'
import { UtilService } from 'src/util/util.service'
import { Model, ProjectionType } from 'mongoose'
import { Symbol, SymbolPositionTier } from 'src/model/Symbol'
import { BitgetService } from '../bitget.service'

@Injectable()
export class BitgetUtilsService {
    DEFAULT_PERCENTAGE_ORDER = 4
    constructor(@InjectModel(Symbol.name) private symbolModel: Model<Symbol>) {
        
    }

    async getLeverageLimit(client: FuturesClient, key: keyof Symbol, value: number | string): Promise<{ maxLeverage: number, minLeverage: number}> {
        const symbolRules = await this.getSymbolBy(key, value);
        return (await client.getLeverageMinMax(symbolRules.symbol)).data;
    }

    async getAccount(client: FuturesClient): Promise<any> {
        const account = await client.getAccounts(BitgetService.PRODUCT_TYPE)
        // const balances = allBalances.filter((bal) => Number(bal.available) != 0);
        return account.data[0]
    }

    async getProfile(client: FuturesClient): Promise<{
        available: number
        totalPnL: number
        unrealizedPL: number
    }> {
        const accountFuture = await this.getAccount(client)
        const result = {
            available: Number(accountFuture.fixedMaxAvailable),
            totalPnL: Number(accountFuture.usdtEquity) - Number(accountFuture.unrealizedPL),
            unrealizedPL: Number(accountFuture.unrealizedPL),
        }
        return result
    }

    async getCurrentPrice(client: FuturesClient, symbol: string): Promise<number> {
        return Number.parseFloat((await client.getMarkPrice(symbol)).data.markPrice)
    }

    async getBaseCoins(client: FuturesClient): Promise<string[]> {
        const result = await client.getSymbols(BitgetService.PRODUCT_TYPE)
        const coins = result.data.map((currentCoin) => currentCoin.baseCoin)
        return coins
    }

    async getSymbolBy(key: keyof Symbol, value: string | number, select?: ProjectionType<Symbol>): Promise<Symbol> {
        return await this.symbolModel.findOne({ [key]: value }, select).lean().exec();
    }

    getQuantityForUSDT(usdt: number, coinPrice: number, leverage: number): number {
        return (usdt / coinPrice) * leverage
    }

    fixPriceByRules(price: number, symbolRules: FuturesSymbolRule): number {
        const priceEndStep = parseInt(symbolRules.priceEndStep)
        const pricePlace = parseInt(symbolRules.pricePlace) * -1
        return exactMath.round(exactMath.ceil(exactMath.round(price, pricePlace) / priceEndStep, pricePlace) * priceEndStep, pricePlace)
    }

    fixSizeByRules(quantity: number, symbolRules: FuturesSymbolRule) {
        const sizeMultiplier = parseFloat(symbolRules.sizeMultiplier)
        if (quantity % sizeMultiplier === 0) {
            return Math.max(quantity, 0)
        } else {
            // calculer la décimal la plus faible du multiplicateur
            if (sizeMultiplier < 1) {
                const multiplierDecimalPlaces = (sizeMultiplier.toString().split('.')[1] || '').length
                const roundedQuantity = Number(quantity.toFixed(multiplierDecimalPlaces))
                // Calculer le multiple précédent inférieur à quantity avec le même nombre de décimales que le multiplicateur
                return parseFloat((Math.floor(roundedQuantity / sizeMultiplier) * sizeMultiplier).toFixed(multiplierDecimalPlaces))
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

    getPositionTier(symbolRules: Symbol, size: number): SymbolPositionTier | undefined {
        const positionTier = symbolRules.positionTier
        for (let i = 0; i < positionTier.length; i++) {
            const tier = positionTier[i]
            if (size >= tier.startUnit && size <= tier.endUnit) {
                return tier;
            }
        }
        return undefined;
    }

    calculateLeverage(
        PE: number,
        margin: number,
        SL: number,
        symbolRules: Symbol,
        side: FuturesHoldSide,
    ): number | null {
        const positionTier = this.getPositionTier(symbolRules, margin)
        let leverage = positionTier.leverage;
        const minLeverage = symbolRules.positionTier[symbolRules.positionTier.length - 1].leverage;
        for (leverage; leverage >= minLeverage; leverage--) {
            const size = this.fixSizeByRules(this.getQuantityForUSDT(margin, PE, leverage), symbolRules);
            const fullQuantityUSDT = size * PE;
            const exactMargin = fullQuantityUSDT / leverage;
            const fees = fullQuantityUSDT * (Number(symbolRules.takerFeeRate) + positionTier.keepMarginRate + Number(symbolRules.feeRateUpRatio));
            if (side === 'long') {
                const liquidityPrice =  PE - (0.98 * (exactMargin - fees)) / size
                if (liquidityPrice < SL) {
                    return leverage
                }
            } else {
                const liquidityPrice =  PE + (0.98 * (exactMargin - fees)) / size
                if (liquidityPrice > SL) {
                    return leverage
                }
            }
        }
        throw new Error('No lever is compatible to respect the SL, informations: ' + JSON.stringify({ PE, margin, SL, minLeverage, symbol: symbolRules.symbol, side }, null, 2));
    }

    caculateTPsToUse(tps: number[], size: number, TPSize: TPSizeType, symbolRules: FuturesSymbolRule, sideOrder: FuturesHoldSide): { TPPrice: number[]; TPSize: number[] } {
        const newTps: number[] = [...tps]
        let TPSizeCalculate: number[] = []
        while (newTps.length > 0) {
            let totalSize = 0
            TPSizeCalculate = []
            const TPSizeMultpliers = TPSize[newTps.length]
            let TPListWrong = false
            if (TPSizeMultpliers) {
                for (let i = 0; i < TPSizeMultpliers.length; i++) {
                    const TPMultiplier = TPSizeMultpliers[i]
                    const isLast = i === TPSizeMultpliers.length - 1
                    let currentSize = 0
                    if (isLast) {
                        currentSize = exactMath.sub(size, totalSize)
                    } else {
                        currentSize = exactMath.mul(TPMultiplier, size)
                    }
                    const sizeTP = this.fixSizeByRules(currentSize, symbolRules)
                    TPSizeCalculate.push(sizeTP)
                    totalSize = exactMath.add(totalSize, sizeTP)
                    if (sizeTP <= 0 || totalSize > size) {
                        TPListWrong = true
                        break
                    }
                }
            } else TPListWrong = true
            if (!TPListWrong && totalSize === size) {
                break
            } else {
                newTps.pop()
            }
        }

        return {
            TPPrice: UtilService.sortBySide(newTps, sideOrder),
            TPSize: TPSizeCalculate,
        }
    }

    canTakeOpenOrder(symbolRules: Symbol, currentPrice: number, order: Order) {
        const buyLimitPriceRatio = Number(symbolRules.buyLimitPriceRatio)
        const sellLimitPriceRatio = Number(symbolRules.sellLimitPriceRatio)
        // is in intervalle fixed by rules
        return (
            (order.side === 'long' &&
                order.PE > currentPrice + currentPrice * buyLimitPriceRatio &&
                order.PE < currentPrice - currentPrice * buyLimitPriceRatio &&
                order.SL > currentPrice) ||
            (order.side === 'short' &&
                order.PE < currentPrice - currentPrice * sellLimitPriceRatio &&
                order.PE > currentPrice + currentPrice * sellLimitPriceRatio &&
                order.SL < currentPrice)
        )
    }

    getMarginFromPosition(PE: number, size: number, leverage: number) {
        return exactMath.round(exactMath.mul(size, PE) / leverage, -3)
    }
}
