import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type TakeProfitDocument = HydratedDocument<TakeProfit>;

@Schema({ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true }})
export class TakeProfit {
    _id: Types.ObjectId;

    @Prop({ required: true })
    triggerPrice: number;

    @Prop({ required: true })
    orderId: string;

    @Prop()
    clientOid: string;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Order' })
    orderParentId: Types.ObjectId;

    @Prop({ required: true })
    quantity: number;

    @Prop({ default: false})
    terminated: boolean;

    @Prop()
    num: number

    @Prop()
    symbol: string;

    @Prop()
    side: 'short' | 'long';

    @Prop({ default: 'USDT'})
    marginCoin: string;
}

export const TakeProfitSchema = SchemaFactory.createForClass(TakeProfit);