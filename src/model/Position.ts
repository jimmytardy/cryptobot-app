import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";


export type PositionDocument = HydratedDocument<Position>;

const synchroExchangeDefault : PositionSynchroExchange = {
    TP: true,
    SL: true,
    order: true
}

@Schema({ _id: false })
export class PositionSynchroExchange {
    @Prop({ required: true, default: true })
    TP: boolean

    @Prop({ required: true, default: true })
    SL: boolean

    @Prop({ required: true, default: true })
    order: boolean;
}

@Schema({ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true }})
export class Position {
    _id: Types.ObjectId

    @Prop({ required: true, type: Types.ObjectId, ref: 'User'})
    userId: Types.ObjectId

    @Prop({ required: true})
    symbol: string

    @Prop({ required: true, default: synchroExchangeDefault })
    synchroExchange: PositionSynchroExchange
}

export const PositionSchema = SchemaFactory.createForClass(Position);
PositionSchema.index({ userId: 1, symbol: 1 }, { unique: true });