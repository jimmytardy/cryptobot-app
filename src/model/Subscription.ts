import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";


export enum SubscriptionEnum {
    LIGHTBOT = 'light-bot',
    BOT = 'bot',
    TRADER = 'trader'
}

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true }})
export class Subscription {
    _id: Types.ObjectId

    @Prop({ required: true, enum: Object.values(SubscriptionEnum) })
    type: SubscriptionEnum

    @Prop({ required: true, unique: true })
    priceId: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);