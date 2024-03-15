import { IUserPayload } from "../../../interfaces/user.interface";

export interface ISubAccount {
    _id: string;
    email: string
    active: boolean;
    numAccount: number
    preferences: {
        bot: {
            pourcentage?: number
            quantity?: number
            strategy: {
                strategyId?: string
                name?: string
            }
        }
    }
    createdAt: Date
}

export interface ISubAccountPayload {
    bitget: IUserPayload['bitget']
}