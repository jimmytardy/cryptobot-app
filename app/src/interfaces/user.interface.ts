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
}

export interface IUser extends IUserPayload {
    _id: string;
}
