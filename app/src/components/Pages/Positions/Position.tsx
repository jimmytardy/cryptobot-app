import { Col, Row } from 'react-bootstrap'
import { IUserOrder } from '.'
import { Check, HourglassSplit } from 'react-bootstrap-icons';

interface IPositionProps {
    order: IUserOrder,
    isPnLPositive: boolean,
}

const Position = ({ order, isPnLPositive }: IPositionProps) => {
    return (
        <Row className={`position position-${order.side} position-${isPnLPositive ? 'success' : 'danger'}`}>
            <Col xs={12} md={6} lg={3} className="position-order">
                <b className="text-title">{order.symbol.replace('USDT_UMCBL', '')}</b>
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
                    <b>Gain cloturées ≈ {order.PnLTerminated.toFixed(2)}</b>
                </span>
                <span>
                    <b>Gain restant ≈ {order.PnLInProgress.toFixed(2)}</b>
                </span>
            </Col>
            <Col xs={12} md={6} lg={3} className="position-trigger">
                {order.TPs.map((tp) => (
                    <span className="position-tp" key={'tp-header-' + tp.orderId}>
                        {tp.activated ? <Check className="icon-check" /> : <HourglassSplit />} {tp.triggerPrice}
                    </span>
                ))}
            </Col>
            <Col xs={12} lg={1} className="position-trigger position-trigger-sl">
                <span className="position-sl">{order.SL?.triggerPrice}</span>
            </Col>
        </Row>
    )
}

export default Position
