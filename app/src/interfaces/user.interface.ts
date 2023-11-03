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
    subscription: Date
}

export interface IUser extends Omit<IUserPayload, 'password'> {
    _id: string;
}
