import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type StopLossDocument = HydratedDocument<StopLoss>;

@Schema({ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true }})
export class StopLoss {
    _id: Types.ObjectId;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    orderId: string;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Order' })
    orderParentId: Types.ObjectId;

    @Prop({ default: -1 })
    step: number // -1: initial, 0: PE, 1: TP1, 2: TP2, 3: TP3...

    @Prop()
    side: 'long' | 'short';

    @Prop()
    symbol: string;

    @Prop({ default: false })
    terminated: boolean;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId
}

export const StopLossSchema = SchemaFactory.createForClass(StopLoss);