import { Type } from 'class-transformer'
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator'

export class PlaceOrderDTO {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(6)
    @IsNumber({}, { each: true })
    TPs: number[]

    @IsArray()
    @ArrayMinSize(1)
    @IsNumber({}, { each: true })
    PEs: number[]

    @IsNumber()
    SL: number

    @IsString()
    @Type(() => String)
    baseCoin: string

    @Type(() => String)
    side: 'short' | 'long'

    @IsOptional()
    @IsNumber()
    size?: number

    @IsOptional()
    @IsString()
    marginCoin?: string
}

export class SetLeverageDTO {
    @IsString()
    @Type(() => String)
    baseCoin: string
}