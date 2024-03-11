import { Types } from "mongoose";
import { TPSizeType } from "src/model/User";

export interface IOrderStrategy {
    SL: IOrderStrategySL;
    TP: IOrderStrategyTP;
    PE: boolean[]
    strategyId?: Types.ObjectId
}

export interface IOrderStrategySL {
    '0': SLStepEnum, // for TP1
    '1': SLStepEnum, // for TP2
    '2': SLStepEnum, // for TP3
    '3': SLStepEnum, // for TP4
    '4': SLStepEnum, // for TP5
}

export interface IOrderStrategyTP {
    numAuthorized: boolean[];
    TPSize: TPSizeType;
}

export enum SLStepEnum {
    Default = -1,
    PE_BAS = 0,
    PE_HAUT = 1,
    TP1 = 2,
    TP2 = 3,
    TP3 = 4,
    TP4 = 5,
}