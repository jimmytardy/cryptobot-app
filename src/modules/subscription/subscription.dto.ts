import { IsArray } from "class-validator";


export class SubscriptionDTO {
    @IsArray()
    priceIds: string[];
}