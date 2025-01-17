import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { FuturesHoldSide } from 'bitget-api';
import { SchemaTypes, Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface';
import { TPSizeType } from './User';

export type OrderDocument = HydratedDocument<Order>;

@Schema({
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
})
export class Order {
    _id: Types.ObjectId

    @Prop({ required: true })
    clOrderId: Types.ObjectId

    @Prop({ required: true })
    PE: number

    @Prop({ required: true })
    TPs: number[]

    @Prop({ required: true })
    SL: number

    @Prop({ required: true })
    symbol: string

    @Prop({ required: true })
    quantity: number

    @Prop({ required: true })
    side: FuturesHoldSide

    @Prop({ required: true })
    sendToPlateform: boolean

    @Prop()
    orderId?: string

    @Prop({ type: SchemaTypes.ObjectId })
    linkOrderId: Types.ObjectId

    @Prop({ default: 'USDT' })
    marginCoin: string

    @Prop({ default: false })
    activated: boolean

    @Prop({ default: false })
    terminated: boolean

    @Prop({ default: false })
    cancelled: boolean

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId

    @Prop({ type: Boolean, default: false })
    inActivation: boolean

    @Prop()
    usdt: number

    @Prop()
    leverage?: number

    @Prop({ type: SchemaTypes.Mixed })
    strategy?: IOrderStrategy

    @Prop({ type: Array })
    PEsTriggered?: number[]

    @Prop({ type: Array })
    steps: number[]

    @Prop({ type: Array })
    clientOids?: Types.ObjectId[]

    createdAt: Date;
    updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ userId: 1, clOrderId: 1, terminated: 1 })
OrderSchema.index({ userId: 1 })