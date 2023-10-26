import { Accordion, Col, Container, Row } from 'react-bootstrap'
import './index.scss'
import { useEffect, useState } from 'react'
import axiosClient from '../../../../axiosClient'
import Loader from '../../../utils/Loader'
import { Check, CurrencyDollar, HourglassSplit, X } from 'react-bootstrap-icons'

interface IOrderStatus {
    cancelled: boolean
    terminated: boolean
    activated: boolean
    orderId: string
    symbol: string
}

interface IUserOrderTPSL extends IOrderStatus {
    triggerPrice: number
    quantity: number
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
}

interface IPosition {
    [key: string]: IUserOrder[]
}

const Positions = () => {
    const [positions, setPositions] = useState<IPosition>({})
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const loadOrders = async () => {
        setIsLoading(true)
        const ordersResults =
            await axiosClient.get<IUserOrder[]>('/user/orders')
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
            <Accordion className="positions">
                <Row>
                    <Col md={4} className="position-title">
                        <b>Position</b>
                    </Col>
                    <Col md={4} className="position-TP">
                        <b>TPs</b>
                    </Col>
                    <Col md={4} className="position-SL">
                        <b>SL</b>
                    </Col>
                </Row>
                {Object.entries(positions).map(([key, orders]) => {
                    const baseCoin = orders[0].symbol.replace(
                        'USDT_UMCBL',
                        '',
                    )
                    let TpTerminated = 0;
                    let TpCancelled = 0;
                    let TpActivated = 0;

                    for (const order of orders) {
                        for (const tp of order.TPs) {
                            if (tp.terminated) {
                                TpTerminated++;
                            } else if (tp.cancelled) {
                                TpCancelled++;
                            } else if (tp.activated) {
                                TpActivated++;
                            }
                        }
                    }

                    return (
                        <Accordion.Item
                            as={Row}
                            eventKey={key}
                            className={`position-${orders[0].side}`}
                        >
                            <Col xs={12}>
                                <Accordion.Header
                                    as={Row}
                                    className={`position`}
                                >
                                    <Col md={4} className="position-title">
                                        <b>
                                            {baseCoin}
                                        </b>
                                    </Col>
                                    <Col md={4} className="position-TP">
                                        <span>
                                            {TpTerminated}{' '}
                                            <Check className="icon-check" />
                                        </span>
                                        <span>
                                            {TpCancelled}{' '}
                                            <X className="icon-cancelled" />
                                        </span>
                                        <span>
                                            {TpActivated}{' '}
                                            <HourglassSplit className="icon-pending" />
                                        </span>
                                    </Col>
                                    <Col md={4} className="position-SL">
                                        {orders[0].SL.triggerPrice}
                                    </Col>
                                </Accordion.Header>
                                <Accordion.Body as={Row} className="orders">
                                    {orders.map((order) => (
                                        <Col
                                            key={order.orderId}
                                            xs={12}
                                            className="order"
                                        >
                                            <Row className="order-header">
                                                <Col
                                                    xs={1}
                                                    className="order-status"
                                                >
                                                    {order.cancelled ? (
                                                        <span className="cancelled">
                                                            <X />
                                                        </span>
                                                    ) : order.terminated ? (
                                                        <span
                                                            className="terminated"
                                                            title="Terminé"
                                                        >
                                                            <Check />
                                                        </span>
                                                    ) : order.activated ? (
                                                        <span
                                                            className="activated"
                                                            title="Activé"
                                                        >
                                                            <HourglassSplit />
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="pending"
                                                            title="En attente"
                                                        >
                                                            <CurrencyDollar />
                                                        </span>
                                                    )}
                                                </Col>
                                                <Col
                                                    xs={3}
                                                    className="order-PE"
                                                >
                                                    PE: {order.PE} USDT
                                                </Col>
                                                <Col className="order-quantity text-right">
                                                    {order.usdt
                                                        ? order.usdt + 'USDT'
                                                        : order.quantity +
                                                          baseCoin}
                                                </Col>
                                            </Row>
                                            <Row className="order-tp-sl-title">
                                                <Col xs={4} md={2}>
                                                    Status
                                                </Col>
                                                <Col xs={5}>Prix</Col>
                                                <Col xs={5}>Quantité</Col>
                                            </Row>
                                            {order.activated &&
                                                order.TPs.concat([
                                                    order.SL,
                                                ]).map((tp, index) => (
                                                    <Row
                                                        className="order-tp-sl"
                                                        key={
                                                            'order-tp-sl-' +
                                                            index
                                                        }
                                                    >
                                                        <Col
                                                            xs={2}
                                                            md={1}
                                                            className="order-status"
                                                        >
                                                            {tp.cancelled ? (
                                                                <span
                                                                    className="cancelled"
                                                                    title="Annulé"
                                                                >
                                                                    <X />
                                                                </span>
                                                            ) : tp.terminated ? (
                                                                <span
                                                                    className="terminated"
                                                                    title="Terminé"
                                                                >
                                                                    <Check />
                                                                </span>
                                                            ) : tp.activated ? (
                                                                <span
                                                                    className="activated"
                                                                    title="Activé"
                                                                >
                                                                    <HourglassSplit />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className="pending"
                                                                    title="En attente"
                                                                >
                                                                    <CurrencyDollar />
                                                                </span>
                                                            )}
                                                        </Col>

                                                        <Col xs={2} md={1}>
                                                            {tp.num
                                                                ? 'TP' + tp.num
                                                                : 'SL'}
                                                        </Col>

                                                        <Col
                                                            xs={3}
                                                            md={5}
                                                            className="order-PE"
                                                        >
                                                            {tp.triggerPrice}
                                                        </Col>
                                                        <Col
                                                            xs={3}
                                                            md={5}
                                                            className="order-quantity"
                                                        >
                                                            {tp.quantity
                                                                ? tp.quantity /
                                                                      order.quantity +
                                                                  '%'
                                                                : order.quantity +
                                                                  baseCoin}
                                                        </Col>
                                                    </Row>
                                                ))}
                                        </Col>
                                    ))}
                                </Accordion.Body>
                            </Col>
                        </Accordion.Item>
                    )
                })}
            </Accordion>
        </Container>
    )
}

export default Positions
