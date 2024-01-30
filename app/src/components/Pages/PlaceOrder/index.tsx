import { useState } from 'react'
import './index.scss'
import { Form, Button, Row, Col, Container } from 'react-bootstrap'
import axiosClient from '../../../axiosClient'
import { FormProvider, useForm, useFormState } from 'react-hook-form'
import PlaceOrderForm from '../../PlaceOrderForm'

interface IPlaceOrderPayload {
    TPs: (string | undefined)[]
    PEs: (string | undefined)[]
    SL: number
    baseCoin: string
    side: string
    size?: number
    marginCoin: string
}

const PlaceOrder = () => {
    const methods = useForm<IPlaceOrderPayload>({
        defaultValues: {
            TPs: [], // Un tableau pour stocker les TP
            PEs: [undefined, undefined], // Un tableau pour stocker les PE
            SL: 0,
            baseCoin: 'BTC',
            side: 'long',
            size: undefined,
            marginCoin: 'USDT',
        },
    })
    const { errors } = useFormState<IPlaceOrderPayload>({
        control: methods.control,
    })
    const [results, setResults] = useState<{ success: any[]; errors: any[] }>()
    const [submitDisabled, setSubmitDisabled] = useState<boolean>(false) // Un état pour désactiver le bouton d'envoi du formulaire

    // Soumettre le formulaire
    const submitOrder = async (data: IPlaceOrderPayload) => {
        setSubmitDisabled(true)
        if (Number.isNaN(data.size)) delete data.size
        const body = {
            ...data,
            marginCoin: methods.getValues('marginCoin') || 'USDT',
            TPs: [] as number[],
            PEs: [] as number[],
        }
        for (const strTp of data.TPs) {
            const tp = parseFloat(strTp as string)
            if (Number.isNaN(tp) || (tp && tp < 0)) continue
            body.TPs.push(tp)
        }
        for (const strPe of data.PEs) {
            const pe = parseFloat(strPe as string)
            if (Number.isNaN(pe) || (pe && pe < 0)) continue
            body.PEs.push(pe)
        }
        if (body.TPs.length === 0 || body.PEs.length === 0) return
        try {
            const response = await axiosClient.post(
                '/bitget/placeOrder',
                body,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )
            setResults(response.data)
            methods.reset()
        } catch (e) {
            console.error(e)
        } finally {
            setSubmitDisabled(false)
        }
        // Envoyer les données au serveur ici
    }

    return (
        <Container>
            <h2>Placer un ordre</h2>
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(submitOrder)}>
                    <PlaceOrderForm />
                    <Row className="mb-4">
                        <Col xs={12}>
                            <h3>Valeurs optionnelles</h3>
                        </Col>
                        <Col xs={6}>
                            <Form.Label htmlFor="size">
                                Size (optionnel)
                            </Form.Label>
                            <Form.Control
                                {...methods.register('size', {
                                    valueAsNumber: true,
                                })}
                            />
                        </Col>
                        <Col xs={6}>
                            <Form.Label htmlFor="marginCoin">
                                Margin Coin
                            </Form.Label>
                            <Form.Control
                                {...methods.register('marginCoin', {
                                    disabled: true,
                                })}
                            />
                        </Col>
                    </Row>
                    {Object.keys(errors).length > 0 && (
                        <Row>
                            <Col>{JSON.stringify(errors)}</Col>
                        </Row>
                    )}
                    <Col xs={3} className="m-auto">
                        <Button type="submit" disabled={submitDisabled}>
                            Envoyer
                        </Button>
                    </Col>
                    {results && (
                        <Col xs={12}>
                            {results.errors.length > 0 && (
                                <Row>
                                    <Col>
                                        {results.errors.map((error) => (
                                            <div className="text-danger">
                                                {error.message}
                                            </div>
                                        ))}
                                    </Col>
                                </Row>
                            )}
                            {results.success.length > 0 &&
                                results.success.map((data) => (
                                    <Row>
                                        <Col xs={6}>
                                            <ul>
                                                <li>PE: {data.PE}</li>
                                                <li>
                                                    TPs: {data.TPs.join(', ')}
                                                </li>
                                                <li>SL: {data.SL}</li>
                                                <li>Symbol: {data.symbol}</li>
                                                <li>
                                                    Quantity: {data.quantity}
                                                </li>
                                                <li>Type: {data.side}</li>
                                                <li>USDT: {data.usdt}</li>
                                            </ul>
                                        </Col>
                                    </Row>
                                ))}
                        </Col>
                    )}
                </Form>
            </FormProvider>
        </Container>
    )
}

export default PlaceOrder
