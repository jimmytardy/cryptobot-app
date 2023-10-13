import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, IsNumberString, IsOptional, IsString } from "class-validator";

export class PlaceOrderDTO {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(6)
    @IsNumberString()
    TPs: number[];

    @IsArray()
    @ArrayMinSize(1)
    @IsNumberString()
    PEs: number[];

    @IsNumberString()
    SL: number;

    @Type(() => String)
    baseCoin: string;

    @Type(() => String)
    side: 'short' | 'long';

    @IsOptional()
    @IsNumber()
    @IsNumberString()
    size?: number;

    @IsOptional()
    @IsString()
    marginCoin?: string;
}