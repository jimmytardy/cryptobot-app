import { useEffect, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { IOrderBot } from './order-bot.interface'
import axiosClient from '../../../../axiosClient'
import Loader from '../../../utils/Loader'
import './index.scss'
import { PencilSquare } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'

const OrderBot = () => {
    const [orders, setOrders] = useState<IOrderBot[]>()
    const navigate = useNavigate();
    useEffect(() => {
        ;(async () => {
            const response = await axiosClient.get('/order-bot')
            setOrders(response.data)
        })()
    }, []);

    const handleEdit = (id: string) => {
        navigate('/admin/order-bot/' + id);
    }

    if (!orders) return <Loader />

    return (
        <Container className="order-bot bg-black text-white">
            <h2>Liste des ordres du bots</h2>
            <Row className="order-bot-list">
                <Col xs={12} className='order-bot-list-header'>
                    <Row>
                        <Col xs={1}>Base Coin</Col>
                        <Col xs={2}>PE</Col>
                        {[1, 2, 3, 4, 5, 6].map((tp, index) => (
                            <Col xs={1} key={'TP-' + index}>
                                TP{tp}
                            </Col>
                        ))}
                        <Col xs={1}>SL</Col>
                        <Col xs={2} className="text-end">
                            Action
                        </Col>
                    </Row>
                </Col>
                <Col xs={12} className='order-bot-list-body'>
                    {orders.map((order, index) => (
                        <Row className="order-line" key={order._id}>
                            <Col xs={1}>{order.baseCoin}</Col>
                            <Col xs={1}>{order.PEs[0]}</Col>
                            <Col xs={1}>{order.PEs[1]}</Col>
                            {order.TPs.map((tp, index) => (
                                <Col xs={1} key={order._id + '-TP-' + index}>
                                    {tp}
                                </Col>
                            ))}
                            <Col xs={1}>{order.SL}</Col>
                            <Col className='text-end'><PencilSquare onClick={() => handleEdit(order._id)} /></Col>
                        </Row>
                    ))}
                </Col>
            </Row>
        </Container>
    )
}

export default OrderBot
