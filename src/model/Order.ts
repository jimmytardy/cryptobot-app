import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true }})
export class Order {
    _id: Types.ObjectId

    @Prop({ required: true })
    PE: number;

    @Prop({ required: true })
    TPs: number[];

    @Prop({ required: true })
    SL: number;

    @Prop({ required: true })
    orderId: string;

    @Prop({ required: true })
    symbol: string;

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true })
    side: 'short' | 'long';

    @Prop({ type: SchemaTypes.ObjectId })
    linkOrderId: Types.ObjectId;

    @Prop({ default: 'USDT' })
    marginCoin: string;

    @Prop({ default: false})
    activated: boolean;
    
    @Prop({ default: false})
    terminated: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);