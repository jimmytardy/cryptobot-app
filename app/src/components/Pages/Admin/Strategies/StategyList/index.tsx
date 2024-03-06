import { useEffect, useState } from 'react'
import { Button, Col, Container, Row } from 'react-bootstrap'
import { IStrategy } from '../../../../../interfaces/stategy.interface'
import Loader from '../../../../utils/Loader'
import axiosClient from '../../../../../axiosClient'
import dayjs from 'dayjs';
import { useNavigate } from 'react-router'

const StrategyList = () => {
    const [strategies, setStrategies] = useState<IStrategy[]>()
    const navigate = useNavigate();

    useEffect(() => {
        ;(async () => {
            const response = await axiosClient.get('/strategy')
            setStrategies(response.data)
        })()
    }, [])

    if (!strategies) return <Loader />
    return (
        <Container>
            <h2>Liste des stratégies disponibles</h2>
            <Row>
                <Button style={{ width: 200 }} className="ms-auto mb-4" variant="success" onClick={() => navigate('/admin/strategy/new')}>
                    Ajouter une statégie
                </Button>
            </Row>
            <Row className="list-header">
                <Col xs={4} md={5}>
                    Nom
                </Col>
                <Col xs={2} md={2}>
                    Disponible
                </Col>
                <Col xs={3} md={3}>
                    Crée
                </Col>
                <Col xs={3} md={2} className="text-end">
                    Action
                </Col>
            </Row>
            <Row className="list-body">
                <Col>
                    {strategies.map((strategy) => (
                        <Row className="list-body-item" key={strategy._id}>
                            <Col xs={4} md={5}>
                                {strategy.name}
                            </Col>
                            <Col xs={2} md={2}>
                                {strategy.available ? 'Oui' : 'Non'}
                            </Col>
                            <Col xs={3} md={3}>
                                {dayjs(strategy.createdAt).format('DD/MM/YYYY à HH:mm')}
                            </Col>
                            <Col xs={3} md={2} className="text-end">
                                Action
                            </Col>
                        </Row>
                    ))}
                </Col>
            </Row>
        </Container>
    )
}

export default StrategyList
