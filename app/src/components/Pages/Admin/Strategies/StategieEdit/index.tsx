import { useEffect, useState } from 'react'
import { Col, Container, FormCheck, FormControl, FormLabel, Row } from 'react-bootstrap'
import { FormProvider, useForm } from 'react-hook-form'
import { Navigate, useNavigate, useParams } from 'react-router'
import Loader from '../../../../utils/Loader'
import { IStrategyPayload, SLStepEnum, TPSizeType } from '../../../../../interfaces/stategy.interface'
import StrategyForm from '../../../../StrategyForm'

export const TPSizeDefault: TPSizeType = {
    1: [1],
    2: [0.5, 0.5],
    3: [0.25, 0.5, 0.25],
    4: [0.2, 0.3, 0.3, 0.2],
    5: [0.15, 0.2, 0.3, 0.2, 0.15],
    6: [0.1, 0.15, 0.25, 0.25, 0.15, 0.1],
}

const StategieEdit = () => {
    const methods = useForm<IStrategyPayload>({
        defaultValues: {
            name: '',
            description: '',
            active: true,
            strategy: {
                SL: {
                    '0': SLStepEnum.Default,
                    '1': SLStepEnum.Default,
                    '2': SLStepEnum.Default,
                    '3': SLStepEnum.Default,
                    '4': SLStepEnum.Default,
                    '5': SLStepEnum.Default,
                },
                TP: {
                    numAutorized: [true, true, true, true, true, true],
                    TPSize: TPSizeDefault,
                },
            },
        },
    })
    const navigate = useNavigate()
    const [loading, setLoading] = useState<boolean>(true)
    let { id } = useParams()
    if (!id) return <Navigate to={'/admin/strategy'} />

    useEffect(() => {
        if (id !== 'new') {
        }
        setLoading(false)
    }, [])

    if (loading) return <Loader />

    const submitData = (data: IStrategyPayload) => {
        console.log(data)
    }

    return (
        <Container>
            <h2>{methods.getValues('_id') ? 'Modification' : 'Création'} d'une stratégie</h2>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(submitData)}>
                    <Row>
                        <Col xs={12} md={6} lg={4}>
                            <FormCheck id="active" {...methods.register('active')} type="switch" label="Activer la stratégie" />
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={6} lg={4}>
                            <FormLabel htmlFor="name">Nom</FormLabel>
                            <FormControl
                                id="name"
                                {...methods.register('name', {
                                    required: 'Le nom est requis!',
                                })}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} lg={6}>
                            <FormLabel>Description</FormLabel>
                            <FormControl
                                as="textarea"
                                rows={3}
                                className="form-control shadow-none"
                                id="description"
                                {...methods.register('name', {
                                    required: 'Le nom est requis!',
                                })}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <StrategyForm name="strategy" />
                    </Row>
                </form>
            </FormProvider>
        </Container>
    )
}
export default StategieEdit
