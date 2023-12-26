import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { FuturesSymbolRule } from 'bitget-api'
import { Types } from 'mongoose'
import { HydratedDocument } from 'mongoose'

export type SymbolDocument = HydratedDocument<Symbol>
 @Schema({
    _id: false
})
export class SymbolPositionTier {
    @Prop()
    level: number

    @Prop()
    startUnit: number

    @Prop()
    endUnit: number

    @Prop()
    leverage: number

    @Prop()
    keepMarginRate: number
}

@Schema({
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: false
})
export class Symbol implements FuturesSymbolRule {
    _id: Types.ObjectId
    @Prop()
    baseCoin: string
    @Prop()
    buyLimitPriceRatio: string
    @Prop()
    feeRateUpRatio: string
    @Prop()
    limitOpenTime: string
    @Prop()
    maintainTime: string
    @Prop()
    makerFeeRate: string
    @Prop()
    maxOrderNum: string
    @Prop()
    maxPositionNum: string
    @Prop()
    minTradeNum: string
    @Prop()
    minTradeUSDT: string
    @Prop()
    offTime: string
    @Prop()
    openCostUpRatio: string
    @Prop()
    priceEndStep: string
    @Prop()
    pricePlace: string
    @Prop()
    quoteCoin: string
    @Prop()
    sellLimitPriceRatio: string
    @Prop()
    sizeMultiplier: string
    @Prop()
    supportMarginCoins: string[]
    @Prop()
    symbol: string
    @Prop()
    symbolName: string
    @Prop()
    symbolStatus: string
    @Prop()
    symbolType: string
    @Prop()
    takerFeeRate: string
    @Prop()
    volumePlace: string
    
    @Prop({ select: false, default: [] })
    positionTier: SymbolPositionTier[]

    @Prop({ default: 'bitget' })
    plateform: string
}

export const SymbolSchema = SchemaFactory.createForClass(Symbol)