import { Type } from "class-transformer";
import { IsObject, IsString, Validate, ValidateNested } from "class-validator";
import { IUserCryptoExchange } from "src/model/User";

export class CreateUserDTO {
    @IsString()
    firstname: string;

    @IsString()
    lastname: string;

    @IsString()
    email: string;

    @IsString()
    password: string

    @Type(() => IUserCryptoExchange)
    bitget: IUserCryptoExchange
}