import { Accordion, Col, Row } from 'react-bootstrap'
import './index.scss';

export interface BitgetPosition {
    baseCoin: string
    holdSide: 'long' | 'short'
    leverage: number
    margin: number
}

interface IPositionsProps {
    positions: BitgetPosition[]
}

const Positions = ({ positions }: IPositionsProps) => {
    return (
        <Accordion as={Col} className='positions'>
            <Accordion.Item as={Row} eventKey="0">
                <Accordion.Header as={Col}>
                    <Row>
                        <Col xs={12}>
                            <div className="form-title">
                                <b>Positions</b>
                            </div>
                        </Col>
                    </Row>
                </Accordion.Header>
                <Accordion.Body as={Col} className="positions">
                    {positions.map((position, index: number) => (
                        <Row
                            className={'position position-' + position.holdSide}
                            key={index + position.baseCoin}
                        >
                            <Col xs={4}>
                                <b>{position.baseCoin}</b>
                                <br />x{position.leverage}
                            </Col>
                            <Col xs={8}>
                                <b>{position.margin.toFixed(2)} USDT</b>
                                <br />
                                {position.holdSide.toUpperCase()}
                            </Col>
                        </Row>
                    ))}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    )
}

export default Positions
