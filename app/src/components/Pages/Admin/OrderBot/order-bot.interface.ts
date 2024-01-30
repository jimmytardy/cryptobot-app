import { IOrder } from "../../../../interfaces/order.interface";

export interface IOrderBot extends IOrder {
    messageId: string;
    linkOrderId: string;
}