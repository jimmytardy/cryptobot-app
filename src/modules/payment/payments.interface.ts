import { SubscriptionEnum } from "src/model/Subscription";

export interface ISubscriptionUser {
    rights: SubscriptionEnum[],
    active: boolean;
    status: string;
    name: string;
}