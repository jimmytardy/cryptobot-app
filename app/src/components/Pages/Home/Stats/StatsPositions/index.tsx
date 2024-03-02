import { Col, Container, Row } from 'react-bootstrap'
import { Check, HourglassSplit } from 'react-bootstrap-icons'
import { IPosition } from '../stat.interface'
import './index.scss'

interface IPositionProps {
    positions: IPosition[]
}

const StatsPositions = ({ positions }: IPositionProps) => {
    return (
        <Container className="stats-positions">
            <Row className={`position`}>
                <Col xs={5} md={4} lg={3} xl={2} className="position-title">
                    <b>Nom</b>
                </Col>
                <Col xs={5} md={6} lg={7} xl={9} className="position-trigger">
                    TPs
                </Col>
                <Col xs={2} lg={2} xl={1} className="position-trigger position-trigger-sl">
                    SL
                </Col>
            </Row>
            {positions.map((position) => (
                <Row key={position.symbol} className={`position position-${position.side}`}>
                    <Col xs={5} md={4} lg={3} xl={2} className="position-title">
                        <b>{position.symbol}</b>
                    </Col>
                    <Col xs={5} md={6} lg={7} xl={9} className="position-trigger">
                        {position.TPs.map((tp, index) => (
                            <span className={`position-tp position-${tp.activated ? 'activated': "wait"}`} key={'tp-header-' + position.symbol + index}>
                                {tp.activated ? <Check className="icon-check" /> : <HourglassSplit />} {tp.triggerPrice}
                            </span>
                        ))}
                    </Col>
                    <Col xs={2} lg={2} xl={1} className="position-trigger position-trigger-sl">
                        <span className="position-sl position-wait">{position.SL}</span>
                    </Col>
                </Row>
            ))}
        </Container>
    )
}

export default StatsPositions
