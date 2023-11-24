import { useEffect, useState } from 'react'
import { IOrderBot } from '../order-bot.interface'
import { useNavigate, useParams } from 'react-router'
import axiosClient from '../../../../../axiosClient'
import Loader from '../../../../utils/Loader'
import { FormProvider, useForm, useFormState } from 'react-hook-form'
import { Col, Container, Row, Form, Button } from 'react-bootstrap'
import ControllerArrayNumber from '../../../../utils/form/ControllerArrayNumber'

const OrderBotEdit = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [message, setMessage] = useState<string>();
    const navigate = useNavigate()
    let { id } = useParams()
    const methods = useForm<IOrderBot>();
    const formState = useFormState<IOrderBot>({ control: methods.control });
    useEffect(() => {
        ;(async () => {
            const response = await axiosClient.get<IOrderBot>(
                '/order-bot/' + id,
            )
            if (!response) return navigate('/admin/order-bot')
            const formData = response.data
            for (let i = formData.TPs.length; i < 6; i++) {
                formData.TPs.push(undefined)
            }
            for (let i = formData.PEs.length; i < 2; i++) {
                formData.PEs.push(undefined)
            }
            methods.reset(response.data)
            setIsLoading(false)
        })()
    }, [])

    if (isLoading) return <Loader />

    const handleOrderBotSave = async (data: IOrderBot) => {
        try {
            const formData = {
                SL: data.SL,
                TPs: data.TPs,
                PEs: data.PEs,
            }
            const result = await axiosClient.post<{ message: string }>('/order-bot/' + id, formData);
            methods.reset(formData);
            setMessage(result.data.message);
        } catch (error: any) {
            setMessage(error.response.data.message)
        }
    }

    return (
        <Container className="bg-dark text-white">
            <h2>Edition d'un ordre de bot</h2>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(handleOrderBotSave)}>
                    <Row className="mb-4">
                        <Col xs={4} md={2}>
                            <Form.Label htmlFor="baseCoin">
                                Base Coin
                            </Form.Label>
                            <Form.Control
                                {...methods.register('baseCoin', {
                                    required: true,
                                    valueAsNumber: true,
                                    disabled: true,
                                })}
                            />
                        </Col>
                        <Col xs={4} md={2}>
                            <Form.Label htmlFor="side">Side</Form.Label>
                            <Form.Control
                                {...methods.register('side', {
                                    required: true,
                                    valueAsNumber: true,
                                    disabled: true,
                                })}
                            />
                        </Col>
                    </Row>
                    <ControllerArrayNumber<IOrderBot> field={'PEs'} max={2}/>
                    <ControllerArrayNumber<IOrderBot> field={'TPs'} max={6} />
                    <Row className="mb-4">
                        <Col xs={4} md={2}>
                            <Form.Label htmlFor="SL">SL</Form.Label>
                            <Form.Control
                                {...methods.register('SL', {
                                    required: true,
                                    valueAsNumber: true,
                                })}
                            />
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col xs={4} md={2} className='m-auto'>
                            <Button disabled={!formState.isDirty} type="submit">Enregistrer</Button>
                            {message && <p>{message}</p>}
                        </Col>
                    </Row>
                </form>
            </FormProvider>
        </Container>
    )
}

export default OrderBotEdit
