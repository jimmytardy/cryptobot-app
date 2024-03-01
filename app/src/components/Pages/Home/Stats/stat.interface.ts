export interface IStats {
    nbTerminated: number,
    nbInProgress: number,
    nbWaitToSendPlateform: number,
    nbTotalTP: number,
    nbTP: number[],
    nbTotalSL: number,
    nbSL: {
        '-1': number,
       '0': number,
        '1': number,
        '2': number,
        '3': number,
        '4': number,
        '5': number,
    },
    positions: IPosition[]
}

export interface IPosition {
    usdt: number
    symbol: string
    PE: number
    side: string
    quantity: number
    TPs: { activated: boolean; triggerPrice: number }[]
    SL: number
}
