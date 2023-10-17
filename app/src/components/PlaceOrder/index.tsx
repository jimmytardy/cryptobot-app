import { useEffect, useState } from 'react'
import './index.scss'
import { Form, Button, Row, Col, Container } from 'react-bootstrap'
import axiosClient from '../../axiosClient'

interface FormData {
    TPs: (number | undefined)[]
    PEs: (number | undefined)[]
    SL: number
    baseCoin: string
    side: string
    size?: number
    marginCoin: string
}
const PlaceOrder = () => {
    const [formData, setFormData] = useState<FormData>({
        TPs: [undefined, undefined, undefined, undefined, undefined, undefined], // Un tableau pour stocker les TP
        PEs: [undefined, undefined], // Un tableau pour stocker les PE
        SL: 0,
        baseCoin: 'BTC',
        side: 'long',
        size: undefined,
        marginCoin: 'USDT',
    })
    const [submitDisabled, setSubmitDisabled] = useState<boolean>(false) // Un état pour désactiver le bouton d'envoi du formulaire
    const [baseCoins, setBaseCoins] = useState<string[]>([]) // Un état pour stocker les baseCoins

    useEffect(() => {
        ;(async () => {
            const result = await axiosClient.get('/bitget/baseCoins')
            setBaseCoins(result.data)
        })()
    }, [])

    // Gérer les changements dans les TP
    const handleTPChange = (index: number, value: number) => {
        const newTPs = [...formData.TPs]
        newTPs[index] = Number(value)
        setFormData({ ...formData, TPs: newTPs })
    }

    // Gérer les changements dans les PE
    const handlePEChange = (index: number, value: number) => {
        const newPEs = [...formData.PEs]
        newPEs[index] = Number(value)
        setFormData({ ...formData, PEs: newPEs })
    }

    const handleSLChange = (e: any) => {
        const SL = Number(e.target.value)
        setFormData({ ...formData, SL })
    }

    // Gérer les changements dans les autres champs
    const handleChange = (e: any) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    // Soumettre le formulaire
    const handleSubmit = async (e: any) => {
        e.preventDefault()
        setSubmitDisabled(true)
        const body = {
            ...formData,
            TPs: formData.TPs.filter((tp: number | undefined) => tp && tp > 0),
            PEs: formData.PEs.filter((pe: number | undefined) => pe && pe > 0),
        }
        if (body.TPs.length === 0 || body.PEs.length === 0) return
        const result = await axiosClient.post('/bitget/placeOrder', {
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        console.log('result', result)
        setSubmitDisabled(false)
        // Envoyer les données au serveur ici
    }

    return (
        <Container>
            <h1>Formulaire</h1>
            <Form onSubmit={handleSubmit}>
                <Row className="mb-4">
                    {formData.PEs.map((pe, index) => (
                        <Col xs={3} key={'pe-' + index}>
                            <Form.Label htmlFor={'pe-' + index}>
                                PE {index + 1}
                            </Form.Label>
                            <Form.Control
                                id={'pe-' + index}
                                value={pe}
                                type="number"
                                onChange={(e: any) =>
                                    handlePEChange(index, e.target.value)
                                }
                            />
                        </Col>
                    ))}
                </Row>
                <Row className="mb-4">
                    {formData.TPs.map((tp, index) => (
                        <Col key={'tp-' + index}>
                            <Form.Label htmlFor={'tp-' + index}>
                                TP {index + 1}
                            </Form.Label>
                            <Form.Control
                                type="number"
                                value={tp}
                                id={'tp-' + index}
                                onChange={(e: any) =>
                                    handleTPChange(index, e.target.value)
                                }
                            />
                        </Col>
                    ))}
                </Row>
                <Row className="mb-4">
                    <Col xs={4}>
                        <Form.Label htmlFor="SL">SL</Form.Label>
                        <Form.Control
                            id="SL"
                            name="SL"
                            type="number"
                            defaultValue={formData.SL}
                            onChange={handleSLChange}
                            required
                        />
                    </Col>
                </Row>

                <Row className="mb-4">
                    <Col xs={4}>
                        <Form.Label htmlFor="baseCoin">Base Coin</Form.Label>
                        <Form.Select
                            id="baseCoin"
                            name="baseCoin"
                            value={formData.baseCoin}
                            onChange={handleChange}
                            required
                            disabled={baseCoins.length === 0}
                        >
                            {baseCoins.map((coin) => (
                                <option key={coin} value={coin}>
                                    {coin}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col xs={4}>
                        <Form.Label htmlFor="side">Side</Form.Label>
                        <Form.Select
                            id="side"
                            name="side"
                            value={formData.side}
                            onChange={handleChange}
                            required
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
                        <Form.Label htmlFor="size">Size (optionnel)</Form.Label>
                        <Form.Control
                            id="size"
                            name="size"
                            value={formData.size}
                            onChange={handleChange}
                        />
                    </Col>
                    <Col xs={6}>
                        <Form.Label htmlFor="marginCoin">
                            Margin Coin
                        </Form.Label>
                        <Form.Control
                            id="marginCoin"
                            name="marginCoin"
                            value={formData.marginCoin}
                            disabled={true}
                        />
                    </Col>
                </Row>
                <Col xs={3} className="m-auto">
                    <Button type="submit" disabled={submitDisabled}>
                        Envoyer
                    </Button>
                </Col>
            </Form>
        </Container>
    )
}

export default PlaceOrder
