export interface IOrderBot {
    _id: string;
    messageId: string;
    PEs: (number | undefined)[]
    TPs: (number | undefined)[]
    SL: number
    baseCoin: string;
    side: 'long' | 'short';
    linkOrderId: string;
}