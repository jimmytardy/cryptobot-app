import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { SchemaTypes, Types } from 'mongoose'
import { HydratedDocument } from 'mongoose'

export type ErrorTraceDocument = HydratedDocument<ErrorTrace>

export enum ErrorTraceSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    IMMEDIATE = 'immediate',
}

@Schema({
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
})
export class ErrorTrace {
    _id: Types.ObjectId

    @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
    userId: Types.ObjectId

    @Prop({ enum: ErrorTraceSeverity, default: ErrorTraceSeverity.ERROR })
    severity: string;

    @Prop({ default: false, type: Boolean })
    finish: boolean

    @Prop({ type: String })
    functionName: string

    @Prop({ required: true, type: SchemaTypes.Mixed })
    context: any
}

export const ErrorTraceSchema = SchemaFactory.createForClass(ErrorTrace)
