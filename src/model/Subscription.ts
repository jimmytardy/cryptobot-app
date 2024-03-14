import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";


export enum SubscriptionEnum {
    BOT = 'bot',
    TRADER = 'trader',
    SUB_ACCOUNT = 'sub-account'
}

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true }})
export class Subscription {
    _id: Types.ObjectId

    @Prop({ required: true, index: true, enum: Object.values(SubscriptionEnum) })
    type: SubscriptionEnum

    @Prop({ required: true, default: [] })
    priceIds: string[];
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);