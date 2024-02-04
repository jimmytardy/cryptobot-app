import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'
import { HydratedDocument } from 'mongoose'

export type StopLossDocument = HydratedDocument<StopLoss>

@Schema({
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
})
export class StopLoss {
    _id: Types.ObjectId

    @Prop({ required: true })
    price?: number

    @Prop({ required: true })
    orderId: string

    @Prop({ required: true })
    clOrderId: Types.ObjectId

    @Prop({ required: true, type: Types.ObjectId, ref: 'Order' })
    orderParentId: Types.ObjectId

    @Prop({ default: -1 })
    step: number // -1: initial, 0: PE1, 1: PE2, TP1, 2: TP2, 3: TP3...

    @Prop({ required: true })
    triggerPrice: number

    @Prop({ default: false })
    updated: boolean

    @Prop()
    side: 'long' | 'short'

    @Prop()
    symbol: string

    @Prop({ default: false })
    terminated: boolean

    @Prop({ default: false })
    cancelled: boolean

    @Prop({ default: false })
    activated: boolean

    @Prop({ default: [] })
    historyTrigger: number[]

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId
}

export const StopLossSchema = SchemaFactory.createForClass(StopLoss)

StopLossSchema.index({ userId: 1, clOrderId: 1, terminated: 1 })
StopLossSchema.index({ userId: 1 })