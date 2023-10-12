import { Injectable } from '@nestjs/common';
import { PlaceOrderDTO } from './bitget.dto';
import { ConfigService } from '@nestjs/config';
import { FuturesClient, FuturesOrderSide } from 'bitget-api';
import { BitgetActionService } from './bitget-action/bitget-action.service';
import { BitgetUtilsService } from './bitget-utils/bitget-utils.service';
import { Types } from 'mongoose';
import { Order } from 'src/model/Order';
import { TakeProfit } from 'src/model/TakeProfit';
import { StopLoss } from 'src/model/StopLoss';

@Injectable()
export class BitgetService {

    client: FuturesClient;

    constructor(
        private configService: ConfigService, 
        private bitgetUtilsService: BitgetUtilsService, 
        private bitgetActionService: BitgetActionService
        ) { 
        const bitgetParams = this.configService.get('bitget');
        this.client = new FuturesClient({
            apiKey: bitgetParams.apiKey, 
            apiPass: bitgetParams.passphrase,
            apiSecret: bitgetParams.secretKey,
        });
    }

    async placeOrder(placeOrderDTO: PlaceOrderDTO) {
        let { PEs, SL, TPs, side, baseCoin, size, marginCoin = 'USDT' } = placeOrderDTO;
        const symbolRules = await this.bitgetUtilsService.getSymbolBy(this.client, 'baseCoin', baseCoin);
        if (!symbolRules) {
            return;
        }
        if (!size) {
            const balance = await this.bitgetUtilsService.getAccountUSDT(this.client, marginCoin);
            size = balance * 0.06;
        }
        const fullSide = 'open_' + side as FuturesOrderSide;
        const linkOrderId = new Types.ObjectId();
        const results = {
            errors: [],
            success: []
        };
        for (const PE of PEs) {
            try {
                results.success.push(await this.bitgetActionService.placeOrder(this.client, symbolRules, size, fullSide, PE, TPs, SL, linkOrderId));
            } catch (error) {
                results.errors.push(error);
            }
        }
        return results;
    }

    async activeOrder(orderId: string) {
        const order = await this.bitgetActionService.activeOrder(this.client, orderId);
        return order;
    }

    async upgradeSL(order: Order): Promise<StopLoss> {
        return await this.bitgetActionService.upgradeSL(this.client, order);
    }

}
