import { Container } from 'react-bootstrap'
import './index.scss'
import { useState } from 'react'
import PositionsInProgress from './PositionsInProgress'
import PositionsTerminated from './PositionsTerminated'

interface IOrderStatus {
    cancelled: boolean
    terminated: boolean
    orderId: string
    symbol: string
    PnL: number
    activated: boolean
    PnLPourcentage: number
}

interface IUserOrderTPSL extends IOrderStatus {
    triggerPrice: number
    quantity: number
    activated: boolean
    clOrder: string
    num: number
}

export interface IUserOrder extends IOrderStatus {
    TPs: IUserOrderTPSL[]
    SL: IUserOrderTPSL
    side: 'long' | 'short'
    linkOrderId?: string
    PE: number
    usdt: number
    quantity: number
    quantityAvailable: number
    PnLTerminated: number
    PnLInProgress: number
    currentPrice: number
    _id: string
}

export interface IPosition {
    [key: string]: IUserOrder[]
}

const Positions = () => {
    const [positionsInProgress, setPositionsInProgress] = useState<IPosition>()
    const [viewMode,] = useState<'in-progress' | 'terminated'>('in-progress')

    // const handleChangeView = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setViewMode(e.target.value as 'in-progress' | 'terminated')
    // }

    return (
        <Container>
            <h2>Liste de mes positions</h2>
            {/* <Form.Group>
                <Form.Check onChange={handleChangeView} label="Positions en cours" name="position" type={'radio'} id={`position-in-progress`} value={'in-progress'} checked={viewMode === 'in-progress'} />
                <Form.Check onChange={handleChangeView} label="Positions terminés" name="position" type={'radio'} id={`position-terminated`} value={'terminated'} checked={viewMode === 'terminated'} />
            </Form.Group> */}
            {viewMode === 'in-progress' ? <PositionsInProgress positions={positionsInProgress} setPositions={setPositionsInProgress} /> : <PositionsTerminated />}
        </Container>
    )
}

export default Positions
