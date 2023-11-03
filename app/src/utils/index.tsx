import { IUser } from "../interfaces/user.interface";

export const isNumber = (value: string | number) => {
    if (typeof value === 'number') return true;
    return !Number.isNaN(parseFloat(value));
}

export const isTrader = (user: IUser): boolean => {
    return user.role === 'trader' || user.role === 'mainbot';
}