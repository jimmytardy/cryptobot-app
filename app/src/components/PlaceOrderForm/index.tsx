import { useFormContext } from 'react-hook-form'
import { IOrder } from '../../interfaces/order.interface'
import { Col, Container, Form, Row } from 'react-bootstrap'
import ControllerArrayNumber from '../utils/form/ControllerArrayNumber'
import InputBaseCoin from '../utils/form/InputInputBaseCoin'

interface IPlaceOrderFormProps {
    lockedFields?: {
        baseCoin?: string
        side?: IOrder['side']
    }
}
const PlaceOrderForm = ({ lockedFields }: IPlaceOrderFormProps) => {
    const { register, setValue, getValues } = useFormContext<IOrder>();

    return (
        <Container className="place-order-render">
            <Row className="mb-3">
                <Col xs={3}>
                    <Form.Label htmlFor="baseCoin">Base Coin</Form.Label>
                    {lockedFields?.baseCoin ? (
                        <Form.Control
                            {...register('baseCoin', {
                                required: true,
                            })}
                            value={lockedFields?.baseCoin}
                            readOnly
                        />
                    ) : (
                        <InputBaseCoin onSelect={(baseCoin) => setValue('baseCoin', baseCoin)} />
                    )}
                </Col>
                <Col xs={3}>
                    <Form.Label htmlFor="side">Side</Form.Label>
                    {lockedFields?.side ? (
                        <Form.Control value={lockedFields?.side} readOnly />
                    ) : (
                        <Form.Select
                            {...register('side', {
                                required: true,
                            })}
                            value={getValues('side') || 'long'}
                        >
                            <option value="long">long</option>
                            <option value="short">short</option>
                        </Form.Select>
                    )}
                </Col>
            </Row>
            <ControllerArrayNumber<IOrder> field="PEs" max={2} />
            <ControllerArrayNumber<IOrder> field="TPs" max={6} />
            <Row className="mb-4">
                <Col xs={4}>
                    <Form.Label htmlFor="SL">SL</Form.Label>
                    <Form.Control
                        {...register('SL', {
                            required: true,
                            valueAsNumber: true,
                        })}
                    />
                </Col>
            </Row>
        </Container>
    )
}

export default PlaceOrderForm
