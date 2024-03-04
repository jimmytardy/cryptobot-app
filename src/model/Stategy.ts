import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { FuturesHoldSide } from 'bitget-api';
import { SchemaTypes, Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface';

export type OrderDocument = HydratedDocument<Strategy>;

@Schema({
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
})
export class Strategy {
    _id: Types.ObjectId

    @Prop({ required: true, type: String })
    name: string;

    @Prop({ required: true, type: String })
    description: string;

    @Prop({ required: true, type: String })
    strategy: IOrderStrategy;

    createdAt: Date;
    updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Strategy);