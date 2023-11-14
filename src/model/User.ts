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
                value: 3,
            },
            {
                minPrice: 0.1,
                value: 5,
            },
            {
                minPrice: 1,
                value: 8,
            },
            {
                minPrice: 10,
                value: 12,
            },
            {
                minPrice: 50,
                value: 15,
            },
            {
                minPrice: 100,
                value: 17,
            },
            {
                minPrice: 500,
                value: 22,
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

    @Prop({ default: false })
    isAdmin: boolean

    @Prop({ default: false })
    active: boolean

    @Prop({ type: String })
    stripeCustomerId: string
}

export const UserSchema = SchemaFactory.createForClass(User)
