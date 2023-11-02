import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaType, Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type TakeProfitDocument = HydratedDocument<TakeProfit>;

@Schema({ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true }})
export class TakeProfit {
    _id: Types.ObjectId;

    @Prop({ required: true })
    triggerPrice: number;

    @Prop({ required: true })
    clOrderId: Types.ObjectId;

    @Prop({ required: true })
    orderId: string;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Order' })
    orderParentId: Types.ObjectId;

    @Prop({ required: true })
    quantity: number;

    @Prop({ default: false})
    terminated: boolean;

    @Prop({ default: false })
    cancelled: boolean;

    @Prop({ default: false })
    activated: boolean;
    
    @Prop({ default: false })
    updated: boolean;

    @Prop()
    num: number

    @Prop()
    symbol: string;

    @Prop()
    side: 'short' | 'long';

    @Prop({ default: 'USDT'})
    marginCoin: string;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId
}

export const TakeProfitSchema = SchemaFactory.createForClass(TakeProfit);

TakeProfitSchema.index({ userId: 1, clOrderId: 1, terminated: 1 })
TakeProfitSchema.index({ userId: 1 })