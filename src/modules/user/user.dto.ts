import { Type } from 'class-transformer'
import {
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    Validate,
    ValidateNested,
} from 'class-validator'
import { IUserCryptoExchange } from 'src/model/User'

export class CreateUserDTO {
    @IsString()
    firstname: string

    @IsString()
    lastname: string

    @IsString()
    email: string

    @IsString()
    password: string

    @Type(() => IUserCryptoExchange)
    bitget: IUserCryptoExchange
}

export class UpdateConfigDTO {
    @IsNumber()
    @IsOptional()
    quantity: number

    @IsNumber()
    @IsOptional()
    pourcentage: number
}
