import { ArrayMinSize, IsArray, IsNumber } from "class-validator"

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