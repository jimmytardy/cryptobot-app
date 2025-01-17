export interface IUserPayload {
    firstname: string
    lastname: string
    email: string
    password: string
    bitget: {
        api_key: string
        api_secret_key: string
        api_pass: string
    }
    referralCode?: string
}

export enum UserSubscriptionEnum {
    BOT = 'bot',
    TRADER = 'trader',
    SUB_ACCOUNT = 'sub-account'
}

export interface IUserUpdatePayload {
    active?: boolean;
}

export interface IUserSubscriptionItem {
    _id: string
    rights: UserSubscriptionEnum[]
    name: string
    active: boolean
    status: string
}
export interface IUser extends Omit<IUserPayload, 'password'>, IUserUpdatePayload {
    _id: string
    mainAccountId?: Omit<Omit<IUser, 'bitget'>, 'preferences'>;
    numAccount?: number;
    isAdmin: boolean;
    subscription: IUserSubscriptionItem;
    createdAt: Date
    rights: string[]
}
