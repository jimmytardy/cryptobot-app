export interface IStrategy extends IStrategyPayload {
    _id: string
    createdAt: Date
}

export interface IStrategyPayload {
    _id?: string
    name: string
    description: string
    default: boolean
    strategy: IUserStrategy
    active: boolean
}

export interface IUserStrategy {
    SL: IOrderStrategySL
    TP: IOrderStrategyTP
    PE: boolean[]
    strategyId?: string
}

export interface IOrderStrategySL {
    '0': SLStepEnum // for TP1
    '1': SLStepEnum // for TP2
    '2': SLStepEnum // for TP3
    '3': SLStepEnum // for TP4
    '4': SLStepEnum // for TP5
}

export interface IOrderStrategyTP {
    numAuthorized: boolean[]
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


export const TPSizeDefault: TPSizeType = {
    1: [1],
    2: [0.5, 0.5],
    3: [0.25, 0.5, 0.25],
    4: [0.2, 0.3, 0.3, 0.2],
    5: [0.15, 0.2, 0.3, 0.2, 0.15],
    6: [0.1, 0.15, 0.25, 0.25, 0.15, 0.1],
}

export const defaultStrategy = {
    name: '',
    description: '',
    active: true,
    strategy: {
        PE: [true, true],
        SL: {
            '0': SLStepEnum.Default,
            '1': SLStepEnum.Default,
            '2': SLStepEnum.Default,
            '3': SLStepEnum.Default,
            '4': SLStepEnum.Default,
        },
        TP: {
            numAuthorized: [true, true, true, true, true, true],
            TPSize: TPSizeDefault, 
        },
    },
}