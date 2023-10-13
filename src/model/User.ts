import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class IUserCryptoExchange {
    @Prop()
    api_key: string;

    @Prop()
    api_secret_key: string;

    @Prop()
    api_pass: string;
}

@Schema({ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true }})
export class User {
    _id: Types.ObjectId
    
    @Prop({ required: true })
    firstname: string;

    @Prop({ required: true })
    lastname: string;

    @Prop({ unique: true, require: true, index: true })
    email: string;

    @Prop({ required: true })
    password: string

    @Prop({ type: SchemaTypes.Mixed })
    bitget: IUserCryptoExchange
}

export const UserSchema = SchemaFactory.createForClass(User);