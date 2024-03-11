import { Col, Container, FormText, Row } from 'react-bootstrap'
import { Path } from 'react-hook-form'
import StrategySLForm from './StrategySLForm'
import StrategyTPForm from './StrategyTPForm'
import StrategyPEForm from './StrategyPEForm'

export interface IStrategyFormProps<T> {
    name: Path<T>
}

const StrategyForm = <T extends object>({ name }: IStrategyFormProps<T>) => {
    return (
        <Container>
            <Row>
                <FormText className="text-danger">Il est dangereux de faire une stratégie personnalisé si vous n'êtes pas familier avec les stratégies de trading</FormText>
                <Col xs={12}>
                    <StrategyPEForm name={name} />
                </Col>
                <Col xs={12} lg={6}>
                    <StrategySLForm name={name} />
                </Col>
                <Col xs={12} lg={6}>
                    <StrategyTPForm name={name} />
                </Col>
            </Row>
        </Container>
    )
}

export default StrategyForm
