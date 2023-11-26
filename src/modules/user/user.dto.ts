import { Type } from 'class-transformer'
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsDate,
    IsDefined,
    IsNotEmptyObject,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    Validate,
    ValidateNested,
} from 'class-validator'
import {
    IUserCryptoExchange,
    IUserPreferences,
    LeviersSizeType,
    TPSizeType,
} from 'src/model/User'

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
    TPSize: TPSizeType

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested()
    @Type(() => Array)
    levierSize: LeviersSizeType[]

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
    order: UpdatePreferencesOrderDTO
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
