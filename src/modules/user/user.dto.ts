import { Type } from 'class-transformer'
import {
    IsBoolean,
    IsDate,
    IsDefined,
    IsNotEmptyObject,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator'
import { Types } from 'mongoose'
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface'
import {
    IUserCryptoExchange,
    TPSizeType,
} from 'src/model/User'

export class CreateSubAccountDTO {
    @Type(() => IUserCryptoExchange)
    bitget: IUserCryptoExchange
}

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

    @IsOptional()
    @IsString()
    referralCode?: string

    @IsOptional()
    @Type(() => Object)
    mainAccountId?: Types.ObjectId

    @IsOptional()
    @IsNumber()
    numAccount?: number
}

class UpdatePreferencesOrderDTO {
    @IsOptional()
    @IsNumber()
    pourcentage?: number

    @IsOptional()
    @IsNumber()
    quantity?: number

    @IsObject()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => Object)
    strategy: IOrderStrategy

    @IsOptional()
    @IsString()
    marginCoin: string
}

export class UpdatePreferencesDTO {
    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => UpdatePreferencesOrderDTO)
    bot: UpdatePreferencesOrderDTO
}

export class ProfileUpdateDTO {
    @IsDefined()
    @IsBoolean()
    active: boolean
}

export class UserStatsDTO {
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dateFrom?: Date

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dateTo?: Date
}
