import { IsNotEmpty, IsString } from "class-validator";

export class ConnectInDTO {
    @IsString()
    @IsNotEmpty()
    userId: string;
}