import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { FuturesHoldSide } from 'bitget-api';
import { SchemaTypes, Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type AppConfigDocument = HydratedDocument<AppConfig>;

@Schema({ _id: false })
export class AppConfigBot {
    @Prop({ default: true })
    placeOrder: boolean

    @Prop({ default: true })
    updateOrder: boolean

    @Prop({ default: true })
    cancelOrder: boolean
}

const appConfigDefault = {
    bot: {
        placeOrder: true,
        updateOrder: true,
        cancelOrder: true
    }
}

@Schema({
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    collection: 'app_config'
})
export class AppConfig {
    _id: Types.ObjectId

    @Prop({ type: () => AppConfigBot, default: appConfigDefault.bot }) 
    bot: AppConfigBot
}

export const AppConfigSchema = SchemaFactory.createForClass(AppConfig);