export interface IUserPayload {
    firstname: string
    lastname: string
    email: string
    password: string
    role: 'follower' | 'trader' | 'mainbot'
    bitget: {
        api_key: string
        api_secret_key: string
        api_pass: string
    }
}

export enum UserSubscriptionEnum {
    LIGHTBOT = 'light-bot',
    BOT = 'bot',
    TRADER = 'trader'
}

export interface IUserUpdatePayload {
    active?: boolean;
}

export interface IUserSubscriptionItem {
    _id: string
    type: UserSubscriptionEnum
    priceId: string
    name: string
    active: boolean
    status: string
}
export interface IUser extends Omit<IUserPayload, 'password'>, IUserUpdatePayload {
    _id: string
    subscription: {
        [key in UserSubscriptionEnum]: IUserSubscriptionItem
    }
}
