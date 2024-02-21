import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'
import { HydratedDocument } from 'mongoose'

export type RightDocument = HydratedDocument<Right>
export enum RightEnum {
    TELEGRAM_CHANNEL = "TELEGRAM_CHANNEL",
}


@Schema({
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
})
export class Right {
    _id: Types.ObjectId

    @Prop({ default: [] })
    userIds: Types.ObjectId[]

    @Prop({ enum: Object.values(RightEnum), unique: true })
    name: string
}

export const RightSchema = SchemaFactory.createForClass(Right)
RightSchema.index({ name: 1 }, { unique: true })
