import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { SchemaTypes, Types } from 'mongoose'
import { HydratedDocument } from 'mongoose'

export type UserDocument = HydratedDocument<User>

export type TPSizeType = { [x: string]: number[] }

export type LeviersSizeType = { minPrice: number; value: number }[]

const defaultUserPreference: IUserPreferences = {
    order: {
        TPSize: {
            1: [1],
            2: [0.5, 0.5],
            3: [0.25, 0.5, 0.25],
            4: [0.2, 0.3, 0.3, 0.2],
            5: [0.15, 0.2, 0.3, 0.2, 0.15],
            6: [0.1, 0.15, 0.25, 0.25, 0.15, 0.1],
        },
        levierSize: [
            {
                minPrice: 0,
                value: 10,
            }, // 0-1€, levier 10
            {
                minPrice: 1,
                value: 15,
            }, // 1-10€, levier 15
            {
                minPrice: 10,
                value: 20,
            }, // 10-50€, levier 20
            {
                minPrice: 50,
                value: 20,
            }, // 50-100, levier 20
            {
                minPrice: 250,
                value: 25,
            }, // 250-1000, levier 25
            {
                minPrice: 1000,
                value: 30,
            },
        ],
        marginCoin: 'USDT',
    },
}

@Schema({ _id: false })
export class IUserCryptoExchange {
    @Prop()
    api_key: string

    @Prop()
    api_secret_key: string

    @Prop()
    api_pass: string
}

@Schema({ _id: false })
export class IUserPreferencesOrder {
    @Prop({ type: Number })
    pourcentage?: number

    @Prop({ type: Number })
    quantity?: number

    @Prop({ type: SchemaTypes.Mixed })
    TPSize: TPSizeType

    @Prop({ type: SchemaTypes.Mixed })
    levierSize: LeviersSizeType

    @Prop({ type: String, default: 'USDT' })
    marginCoin: string
}

export class IUserPreferences {
    order: IUserPreferencesOrder
}

@Schema({
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
})
export class User {
    _id: Types.ObjectId

    @Prop({ required: true })
    firstname: string

    @Prop({ required: true })
    lastname: string

    @Prop({ unique: true, require: true, index: true })
    email: string

    @Prop({ required: true })
    password: string

    @Prop({ type: SchemaTypes.Mixed })
    bitget: IUserCryptoExchange

    @Prop({ type: SchemaTypes.Mixed, default: defaultUserPreference })
    preferences: IUserPreferences
}

export const UserSchema = SchemaFactory.createForClass(User);