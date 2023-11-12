import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose"


export type OrderBotDocument = HydratedDocument<OrderBot>;

@Schema({
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
})
export class OrderBot {

    _id: Types.ObjectId

    @Prop({ required: true, type: String, unique: true, index: true })
    messageId: string;
    
    @Prop({ required: true, type: Array})
    PEs: number[]

    @Prop({ required: true, type: Array})
    TPs: number[]

    @Prop({ required: true, type: Number})
    SL: number

    @Prop({ required: true, type: String})
    baseCoin: string;

    @Prop({ required: true, type: String, enum: ['long', 'short']})
    side: 'long' | 'short';

    @Prop({ required: true, type: Types.ObjectId, default: () => new Types.ObjectId() })
    linkOrderId: Types.ObjectId
}

export const OrderBotSchema = SchemaFactory.createForClass(OrderBot);