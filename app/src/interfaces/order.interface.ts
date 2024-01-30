export interface IOrder {
    _id: string;
    PEs: (number | undefined)[]
    TPs: (number | undefined)[]
    SL: number
    baseCoin: string;
    side: 'long' | 'short';
}