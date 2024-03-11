import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { SchemaTypes, Types } from 'mongoose'
import { HydratedDocument } from 'mongoose'
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface'

export type OrderDocument = HydratedDocument<Strategy>

@Schema({
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
})
export class Strategy {
    _id: Types.ObjectId

    @Prop({ required: true, type: String, min: 3 })
    name: string

    @Prop({ required: true, type: String, min: 3 })
    description: string

    @Prop({ required: true, type: SchemaTypes.Mixed })
    strategy: IOrderStrategy

    @Prop({ required: true, default: true })
    active: boolean

    @Prop({ type: Boolean, default: false })
    default: boolean

    createdAt: Date
    updatedAt: Date
}

export const StrategySchema = SchemaFactory.createForClass(Strategy)
