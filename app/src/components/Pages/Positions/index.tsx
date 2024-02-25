import { Col, Container, Row } from 'react-bootstrap'
import './index.scss'
import { useEffect, useState } from 'react'
import axiosClient from '../../../axiosClient'
import Loader from '../../utils/Loader'
import {HourglassSplit, X } from 'react-bootstrap-icons'

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

interface IUserOrder extends IOrderStatus {
    TPs: IUserOrderTPSL[]
    SL: IUserOrderTPSL
    side: 'long' | 'short'
    linkOrderId?: string
    PE: number
    usdt: number
    quantity: number
    currentPrice: number
}

interface IPosition {
    [key: string]: IUserOrder[]
}

const Positions = () => {
    const [positions, setPositions] = useState<IPosition>({})
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const loadOrders = async () => {
        setIsLoading(true)
        const ordersResults = await axiosClient.get<IUserOrder[]>('/bitget/orders-active')
        const newPositions: IPosition = {}
        for (const order of ordersResults.data) {
            if (order.linkOrderId) {
                if (!order.linkOrderId) {
                    newPositions[order.orderId] = [order]
                } else {
                    if (!newPositions[order.linkOrderId]) {
                        newPositions[order.linkOrderId] = []
                    }
                    newPositions[order.linkOrderId].push(order)
                }
            }
        }

        setPositions(newPositions)
        setIsLoading(false)
    }

    useEffect(() => {
        loadOrders()
    }, [])

    if (isLoading) return <Loader />

    return (
        <Container>
            <h2>Liste de mes positions</h2>
            <div className="positions">
                {Object.entries(positions).map(([key, orders]) => {
                    const order = orders[0]
                    const baseCoin = orders[0].symbol.replace('USDT_UMCBL', '')
                    let TPsActivated = []
                    let TpsInProgress = []

                    for (const order of orders) {
                        for (const tp of order.TPs) {
                            if (tp.activated) {
                                TPsActivated.push(tp)
                            } else if (!tp.terminated) {
                                TpsInProgress.push(tp)
                            }
                        }
                    }

                    const isPnLPositive = (order.side === 'long' && order.currentPrice > order.PE) || (order.side === 'short' && order.currentPrice < order.PE)

                    return (
                        <Row key={key} className={`position position-${orders[0].side} position-${isPnLPositive ? 'success' : 'danger'}`}>
                            <Col xs={12} md={6} lg={3} className="position-order">
                                <b className='text-title'>{baseCoin}</b>
                                <span>
                                    <b>Prix d'achat: {order.PE}</b>
                                </span>
                                <span>
                                    <b>Type d'ordre: {order.side.toUpperCase()}</b>
                                </span>
                            </Col>
                            <Col xs={12} md={6} lg={2} className="position-order">
                                <span>
                                    <b>Marge: {order.usdt.toFixed(2)}</b>
                                </span>
                                <span>
                                    <b>Prix actuel: {order.currentPrice}</b>
                                </span>
                                <span className={'text-' + (isPnLPositive ? 'success' : 'danger')}>
                                    <b>
                                        {isPnLPositive && '+'}
                                        {order.PnLPourcentage.toFixed(2)}% ({order.PnL.toFixed(2)})
                                    </b>
                                </span>
                            </Col>
                            <Col xs={12} md={6} lg={3} className="position-order">
                                <span>
                                    <b>Gain cloturées ≈ {TPsActivated.reduce((acc, current) => acc + current.PnL, 0).toFixed(2)}</b>
                                </span>
                                <span>
                                    <b>Gain en attente ≈ {TpsInProgress.reduce((acc, current) => acc + current.PnL, 0).toFixed(2)}</b>
                                </span>
                            </Col>
                            <Col xs={12} md={6} lg={3} className="position-trigger">
                                {order.TPs.map((tp) => (
                                    <span className="position-tp" key={'tp-header-' + tp.orderId}>
                                        {tp.activated ? <X /> : <HourglassSplit />} {tp.triggerPrice}
                                    </span>
                                ))}
                            </Col>
                            <Col xs={12} lg={1} className="position-trigger position-trigger-sl">
                                <span className="position-sl">{orders[0].SL?.triggerPrice}</span>
                            </Col>
                        </Row>
                    )
                })}
            </div>
        </Container>
    )
}

export default Positions
