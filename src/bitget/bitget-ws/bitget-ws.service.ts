import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { WebsocketClient } from 'bitget-api';
import { Model } from 'mongoose';
import { Order } from 'src/model/Order';
import { BitgetActionService } from '../bitget-action/bitget-action.service';
import { BitgetService } from '../bitget.service';
import { ConfigService } from '@nestjs/config';
import { TakeProfit } from 'src/model/TakeProfit';

@Injectable()
export class BitgetWsService implements OnModuleInit {
    client: WebsocketClient;
    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(Order.name) private takeProfitModel: Model<TakeProfit>,
        private bitgetService: BitgetService,
        private configService: ConfigService,
    ) {
        const bitgetParams = this.configService.get('bitget');
        this.client = new WebsocketClient({
            apiKey: bitgetParams.apiKey,
            apiPass: bitgetParams.passphrase,
            apiSecret: bitgetParams.secretKey,
        });
    }

    onModuleInit() {
        this.activateWebSocket(this.client);
    }

    async activateWebSocket(client: WebsocketClient) {
        // client.subscribeTopic('UMCBL', 'ordersAlgo');
        client.subscribeTopic('UMCBL', 'orders');

        client.on('update', (e) => this.onUpdateEvent(e))
    }

    private async onUpdateEvent(e: any) {
        switch (e.arg.channel) {
            case 'orders':
                await this.onUpdatedOrder(e);
                break;
            case 'ordersAlgo':
                await this.onUpdatedOrderAlgo(e);
                break;
            default:
                break;
        }
    }

    private async onUpdatedOrderAlgo(e: any) {
        console.log('onUpdatedOrderAlgo', e);
        
    }

    private async onUpdatedOrder(e: any) {
        const data = e.data;

        for (const order of data) {
            switch (order.status) {
                case 'full-fill':
                    if (order.side === 'buy') {
                        const orderConfig = await this.orderModel.findOne({ terminated: { $ne: true }, orderId: order.ordId });
                        if (!orderConfig) break;
    
                        await this.bitgetService.activeTPs(orderConfig);
                    } else {
                        const takeProfit = await this.takeProfitModel.findOne({ orderId: order.ordId, terminated: { $ne: true } });
                        if (!takeProfit) break;
                        takeProfit.terminated = true;
                        await takeProfit.save();

                        const orderConfig = await this.orderModel.findOne({ orderId: takeProfit.orderParentId });

                        if (takeProfit.num === orderConfig.TPs.length) {
                            orderConfig.terminated = true;
                            await orderConfig.save();
                        } else {
                            await this.bitgetService.upgradeSL(orderConfig);
                        }
                        
                        console.log('sell order', order)
                    }
                default:
                    console.log('order status', order.status)
                    break;
            }
        }
    }
}

