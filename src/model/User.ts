import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { SchemaTypes, Types } from 'mongoose'
import { HydratedDocument } from 'mongoose'
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface'
import { ISubscriptionUser } from 'src/modules/payment/payments.interface'

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
        marginCoin: 'USDT',
        baseCoinAuthorized: undefined,
        automaticUpdate: false,
        pourcentage: 4
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

    @Prop({ type: String, default: 'USDT' })
    marginCoin: string
    
    @Prop({ type: SchemaTypes.Mixed })
    strategy?: IOrderStrategy

    @Prop({ type: SchemaTypes.Array})
    baseCoinAuthorized?: string[]

    @Prop({ type: Boolean, default: false })
    automaticUpdate?: boolean
}

export class IUserPreferences {
    order: IUserPreferencesOrder
}

@Schema({
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    minimize: false,
})
export class User {
    _id: Types.ObjectId

    @Prop({ required: true })
    firstname: string

    @Prop({ required: true })
    lastname: string

    @Prop({ unique: true, require: true, index: true })
    email: string

    @Prop({ required: true, select: false })
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

    @Prop({ type: SchemaTypes.Mixed })
    subscription: ISubscriptionUser

    @Prop({ unique: true })
    referralCode: string

    @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
    referrer: Types.ObjectId
}

export const UserSchema = SchemaFactory.createForClass(User)
