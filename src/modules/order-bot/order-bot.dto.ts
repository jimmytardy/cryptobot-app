import { ArrayMinSize, IsArray, IsNumber, IsNumberString, IsString } from "class-validator"

export class SetOrderBotDTO {
    @IsArray()
    @ArrayMinSize(1)
    @IsNumber({}, { each: true })
    PEs: number[]

    @IsArray()
    @ArrayMinSize(1)
    @IsNumber({}, { each: true })
    TPs: number[]

    @IsNumber()
    SL: number
}

export class NewOrderBotDTO extends SetOrderBotDTO {
    @IsNumberString()
    messageId: string

    @IsString()
    baseCoin: string;

    @IsString()
    side: 'long' | 'short'
}