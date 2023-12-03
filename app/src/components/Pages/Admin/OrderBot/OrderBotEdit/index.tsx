import { useEffect, useRef, useState } from 'react'
import { IOrderBot } from '../order-bot.interface'
import { useNavigate, useParams } from 'react-router'
import axiosClient from '../../../../../axiosClient'
import Loader from '../../../../utils/Loader'
import { FormProvider, useForm, useFormState } from 'react-hook-form'
import { Col, Container, Row, Form, Button } from 'react-bootstrap'
import ControllerArrayNumber from '../../../../utils/form/ControllerArrayNumber'
import { ArraySortEnum, checkSortArray, isObjectId } from '../../../../../utils'
import NotFound from '../../../../utils/NotFound'

const OrderBotEdit = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [message, setMessage] = useState<string>();
    const side = useRef<IOrderBot['side']>()
    const navigate = useNavigate()
    let { id } = useParams()
    const methods = useForm<IOrderBot>();
    const formState = useFormState<IOrderBot>({ control: methods.control });
    useEffect(() => {
        if (!isObjectId(id)) return;
        ;(async () => {
            const response = await axiosClient.get<IOrderBot>(
                '/order-bot/' + id,
            )
            if (!response) return navigate('/admin/order-bot')
            methods.reset(response.data);
            side.current = response.data.side;
            setIsLoading(false)
        })()
    }, [])

    if (isObjectId(id) === false) return <NotFound />

    if (isLoading) return <Loader />

    const handleOrderBotSave = async (data: IOrderBot) => {
        let modeSort = side.current === 'long' ? ArraySortEnum.ASC : ArraySortEnum.DESC;
        if (Math.max(...data.PEs as number[]) > Math.min(...data.TPs as number[])) {
            setMessage('Les PEs doivent être inférieurs aux TPs')
            return
        }

        if (data.SL > Math.min(...data.PEs as number[])) {
            setMessage('Le SL doit être inférieur aux PEs')
            return
        }

        if (data.SL < 0) {
            setMessage('Le SL doit être positif')
            return
        }

        if (data.PEs.length !== data.PEs.filter((tp) => tp).length) {
            setMessage('Chaque PE ouvert doit être définis')
            return
        }
        if (data.TPs.length !== data.TPs.filter((tp) => tp).length) {
            setMessage('Chaque TP ouvert doit être définis')
            return
        }

        if (checkSortArray(data.PEs as number[]) !== modeSort) {
            setMessage('Les PEs doivent être triés par ordre ' + modeSort)
            return
        }

        if (checkSortArray(data.TPs as number[]) !== modeSort) {
            setMessage('Les TPs doivent être triés par ordre ' + modeSort)
            return;
        }

        
        
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
        <Container>
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
                    <ControllerArrayNumber<IOrderBot> field={'PEs'}/>
                    <ControllerArrayNumber<IOrderBot> field={'TPs'} max={6}/>
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
                        <Col xs={12} className='text-center'>
                            {message && <p>{message}</p>}
                        </Col>
                        <Col xs={12} className='text-center m-auto'>
                            <Button style={ {width: 100}} disabled={!formState.isDirty} type="submit">Enregistrer</Button>
                        </Col>
                    </Row>
                </form>
            </FormProvider>
        </Container>
    )
}

export default OrderBotEdit
