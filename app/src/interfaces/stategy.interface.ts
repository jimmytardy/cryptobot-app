export interface IStrategy extends IStrategyPayload {
    _id: string
    createdAt: Date
}

export interface IStrategyPayload {
    _id?: string
    name: string
    description: string
    strategy: IOrderStrategy
    active: boolean
}

export interface IOrderStrategy {
    SL: IOrderStrategySL
    TP: IOrderStrategyTP
    strategyId?: string
}

export interface IOrderStrategySL {
    '0': SLStepEnum // for TP1
    '1': SLStepEnum // for TP2
    '2': SLStepEnum // for TP3
    '3': SLStepEnum // for TP4
    '4': SLStepEnum // for TP5
    '5': SLStepEnum // for TP6
}

export interface IOrderStrategyTP {
    numAutorized: boolean[]
    TPSize: TPSizeType
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

export type TPSizeType = { [x: string]: number[] }