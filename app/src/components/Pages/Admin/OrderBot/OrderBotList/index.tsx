import { useEffect, useState } from 'react'
import { Button, Col, Container, Row } from 'react-bootstrap'
import { IOrderBot } from '../order-bot.interface'
import axiosClient from '../../../../../axiosClient'
import Loader from '../../../../utils/Loader'
import { PencilSquare } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'

const OrderBotList = () => {
    const [orders, setOrders] = useState<IOrderBot[]>()
    const navigate = useNavigate()
    useEffect(() => {
        ;(async () => {
            const response = await axiosClient.get('/order-bot')
            setOrders(response.data)
        })()
    }, [])

    const handleEdit = (id: string) => {
        navigate('/admin/order-bot/' + id)
    }

    if (!orders) return <Loader />

    return (
        <Container className="order-bot list">
            <h2>Liste des ordres du bots</h2>
            <Row>
                <Button style={{width: 200}} className="ms-auto mb-4" variant='success' onClick={() => navigate('/admin/order-bot/new')}>
                    Ajouter un ordre
                </Button>
            </Row>
            <Row className="list-header">
                <Col xs={3} md={1}>Base Coin</Col>
                <Col xs={3} md={1}>PE 1</Col>
                <Col xs={3} md={1}>PE 2</Col>
                {[1, 2, 3, 4, 5, 6].map((tp, index) => (
                    <Col className='d-none d-md-block' xs={1} key={'TP-' + index}>
                        TP{tp}
                    </Col>
                ))}
                <Col className='d-none d-md-block' xs={1}>SL</Col>
                <Col xs={3} md={2} className="text-end">
                    Action
                </Col>
            </Row>
            <Row className="list-body">
                <Col>
                    {orders.map((order) => (
                        <Row className="list-body-item" key={order._id}>
                            <Col xs={3} md={1}>{order.baseCoin}</Col>
                            <Col xs={3} md={1}>{order.PEs[0]}</Col>
                            <Col xs={3} md={1}>{order.PEs[1]}</Col>
                            {order.TPs.map((tp, index) => (
                                <Col className='d-none d-md-block' xs={1} key={order._id + '-TP-' + index}>
                                    {tp}
                                </Col>
                            ))}
                            {Array(6 - order.TPs.length)
                                .fill(0)
                                .map((_, index) => (
                                    <Col className='d-none d-md-block' xs={1} key={order._id + '-TP-' + (order.TPs.length + index)}>
                                        -
                                    </Col>
                                ))}
                            <Col className='d-none d-md-block' xs={1}>{order.SL}</Col>
                            <Col className="text-end" xs={3} md={1}>
                                <PencilSquare cursor={'pointer'} onClick={() => handleEdit(order._id)} />
                            </Col>
                        </Row>
                    ))}
                </Col>
            </Row>
        </Container>
    )
}

export default OrderBotList
