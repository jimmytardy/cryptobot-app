import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class PlaceOrderDTO {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(6)
    @Type(() => Number)
    TPs: number[];

    @IsArray()
    @ArrayMinSize(1)
    @Type(() => Number)
    PEs: number[];

    @Type(() => Number)
    SL: number;

    @Type(() => String)
    baseCoin: string;

    @Type(() => String)
    side: 'short' | 'long';

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    size?: number;

    @IsOptional()
    @IsString()
    marginCoin?: string;
}