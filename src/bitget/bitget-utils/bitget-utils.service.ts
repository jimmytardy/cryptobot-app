import { Injectable } from '@nestjs/common';
import { FuturesClient, FuturesSymbolRule } from 'bitget-api';

@Injectable()
export class BitgetUtilsService {
    async getAccountUSDT(client: FuturesClient, marginCoin: string): Promise<number> {
        const balanceResult = await client.getAccount('TOMOUSDT_UMCBL', marginCoin);
        const accountBalance = balanceResult.data;
        // const balances = allBalances.filter((bal) => Number(bal.available) != 0);
        return accountBalance.available;
    }

    async getCurrentPrice(client: FuturesClient, symbol: string): Promise<number> {
        const candlesToFetch = 1;
        const timestampNow = Date.now();
        const msPerCandle = 60 * 1000; // 60 seconds x 1000
        const msFor1kCandles = candlesToFetch * msPerCandle;
        const startTime = timestampNow - msFor1kCandles;

        const candles = await client.getCandles(symbol, '1m', startTime.toString(), timestampNow.toString(), String(candlesToFetch));
        return Number.parseFloat(candles[candles.length - 1][4]);
    }

    async getSymbolBy(client: FuturesClient, key: string, value: string | number): Promise<FuturesSymbolRule> {
        const result = await client.getSymbols('umcbl');
        const coin = result.data.find(currentCoin => currentCoin[key] == value);
        return coin;
    }

    getQuantityForUSDT(usdt: number, coinPrice: number, leverage: number): number {
        return usdt / coinPrice * leverage;
    }

    fixSizeByRules(quantity: number, symbolRules: FuturesSymbolRule) {
        const replaceAt = function(str: string, index: number, replacement: string) {
            return str.substring(0, index) + replacement + str.substring(index + replacement.length);
        }

        const sizeMultiplier = parseFloat(symbolRules.sizeMultiplier);
        var decimal = sizeMultiplier.toString().split('.').length > 1 ? sizeMultiplier.toString().split('.')[1].length : 0;

        let value: string = (Math.round(quantity / sizeMultiplier) * sizeMultiplier).toFixed(decimal + 1);
        // arrondir au dessus
        if (value[value.length - 1] !== '0') {
            const indexChar = value[value.length - 2] === '0' ? -2: -3;
            value = replaceAt(value, indexChar, '' +  (parseInt(value[indexChar]) + 1));
        }
        value = value.slice(0, -1);
        return parseFloat(value);
    }

    formatNumberByRules(number: number, symbolRules: FuturesSymbolRule) {
        number = Math.round(number * Math.pow(10, Number.parseInt(symbolRules.pricePlace)));
        number = number - (number % Number.parseInt(symbolRules.priceEndStep));
        number = number / Math.pow(10, Number.parseInt(symbolRules.pricePlace));
        return number;
    }
}
