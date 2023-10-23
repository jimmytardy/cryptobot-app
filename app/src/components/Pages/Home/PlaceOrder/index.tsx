import { useEffect, useState } from 'react'
import './index.scss'
import { Form, Button, Row, Col, Container } from 'react-bootstrap'
import axiosClient from '../../../../axiosClient'
import { FormProvider, useForm } from 'react-hook-form'
import ControllerArrayNumber from './ControllerArrayNumber'

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
            TPs: [
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
            ], // Un tableau pour stocker les TP
            PEs: [undefined, undefined], // Un tableau pour stocker les PE
            SL: 0,
            baseCoin: 'BTC',
            side: 'long',
            size: undefined,
            marginCoin: 'USDT',
        },
    })
    const [results, setResults] = useState<{ success: any[]; errors: any[] }>()
    const [submitDisabled, setSubmitDisabled] = useState<boolean>(false) // Un état pour désactiver le bouton d'envoi du formulaire
    const [baseCoins, setBaseCoins] = useState<string[]>([]) // Un état pour stocker les baseCoins

    useEffect(() => {
        ;(async () => {
            const result = await axiosClient.get('/bitget/baseCoins')
            setBaseCoins(result.data.sort())
        })()
    }, [])

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
            console.log(response.data)
            methods.reset()
        } catch (e) {
            console.log(e)
        } finally {
            setSubmitDisabled(false)
        }
        // Envoyer les données au serveur ici
    }

    return (
        <Container>
            <h2>Ordre Bitget</h2>
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(submitOrder)}>
                    <ControllerArrayNumber<IPlaceOrderPayload> field="PEs" />
                    <ControllerArrayNumber<IPlaceOrderPayload> field="TPs" />
                    <Row className="mb-4">
                        <Col xs={4}>
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
                        <Col xs={4}>
                            <Form.Label htmlFor="baseCoin">
                                Base Coin
                            </Form.Label>
                            {baseCoins.length > 0 && (
                                <Form.Select
                                    {...methods.register('baseCoin', {
                                        required: true,
                                    })}
                                >
                                    {baseCoins.map((coin) => (
                                        <option
                                            key={coin}
                                            value={coin}
                                            selected={
                                                methods.getValues(
                                                    'baseCoin',
                                                ) === coin
                                            }
                                        >
                                            {coin}
                                        </option>
                                    ))}
                                </Form.Select>
                            )}
                        </Col>
                        <Col xs={4}>
                            <Form.Label htmlFor="side">Side</Form.Label>
                            <Form.Select
                                {...methods.register('side', {
                                    required: true,
                                })}
                            >
                                <option value="long">long</option>
                                <option value="short">short</option>
                            </Form.Select>
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col xs={12}>
                            <h2>Valeurs optionnelles</h2>
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
                    <Col xs={3} className="m-auto">
                        <Button type="submit" disabled={submitDisabled}>
                            Envoyer
                        </Button>
                    </Col>
                    {results && (
                        <Col xs={12}>
                            <h2>Résultats</h2>
                            <p>
                                Nombre d'ordre réussis: {results.success.length}
                            </p>
                            <p>
                                Nombre d'ordre échoués: {results.errors.length}
                            </p>
                            {results.errors.length > 0 && (
                                <pre>
                                    {JSON.stringify(results.errors, null, 2)}
                                </pre>
                            )}
                        </Col>
                    )}
                </Form>
            </FormProvider>
        </Container>
    )
}

export default PlaceOrder