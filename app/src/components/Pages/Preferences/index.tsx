import { useEffect, useState } from 'react'
import { Controller, FormProvider, useForm, useFormState } from 'react-hook-form'
import axiosClient from '../../../axiosClient'
import Loader from '../../utils/Loader'
import { Accordion, Button, Col, Container, Form, FormCheck, FormControl, FormGroup, FormLabel, FormText, Row } from 'react-bootstrap'
import ControllerArrayNumber from '../../utils/form/ControllerArrayNumber'
import './index.scss'
import Strategie from './Strategie'
import BaseCoinAuthorized from './BaseCoinAuthorized'
import { IOrderStrategy, TPSizeType } from '../../../interfaces/stategy.interface'

export interface IPreferencePayload {
    order: {
        pourcentage?: number
        quantity?: number
        TPSize: TPSizeType
        marginCoin: string
        strategy?: IOrderStrategy
        baseCoinAuthorized?: string[]
        automaticUpdate?: number
    }
}

const Preferences = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const methods = useForm<IPreferencePayload>()
    const [success, setSuccess] = useState<boolean>(false)
    const { errors } = useFormState({ control: methods.control })

    useEffect(() => {
        ;(async () => {
            const preferences = await axiosClient.get('/user/preferences')
            methods.reset(preferences.data)
            if (!preferences.data.order.pourcentage) preferences.data.order.pourcentage = 4
            setIsLoading(false)
        })()
    }, [])

    const submitPreference = async (data: IPreferencePayload) => {
        await axiosClient.post('/user/preferences', data)
        setSuccess(true)
    }

    if (isLoading) return <Loader />

    return (
        <Container className="preferences">
            <h2 className="text-center">Préférences</h2>
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(submitPreference)}>
                    <Row>
                        <Col xs={12} md={5}>
                            <div className="form-title">Solde</div>
                            <Col xs={12}>
                                <FormGroup>
                                    <FormLabel>
                                        <b>Mise à jour automatique du solde (le 1er du mois)</b>
                                    </FormLabel>
                                    <FormCheck type="switch" label="Désactiver / Activer" {...methods.register('order.automaticUpdate')} />
                                </FormGroup>
                            </Col>
                            <Row className="mb-4">
                                <Col xs={12}>
                                    <FormGroup>
                                        <FormLabel>
                                            <b>Solde utilisé: </b>
                                        </FormLabel>
                                        <FormControl
                                            type="number"
                                            size="sm"
                                            min={0}
                                            {...methods.register('order.quantity', {
                                                valueAsNumber: true,
                                                min: 0,
                                            })}
                                        />
                                    </FormGroup>
                                    <FormText className="text-danger">{errors?.order?.pourcentage && 'Le solde doit être supérieur à 0 !'}</FormText>
                                </Col>
                                <Col xs={12}>
                                    <FormGroup>
                                        <FormLabel>
                                            <b>Pourcentage / Ordre: </b>
                                        </FormLabel>
                                        <FormControl
                                            size="sm"
                                            type="number"
                                            min={1}
                                            max={10}
                                            {...methods.register('order.pourcentage', {
                                                min: 1,
                                                max: 10,
                                                valueAsNumber: true,
                                            })}
                                        />
                                        <FormText className="text-danger">{errors?.order?.pourcentage && 'Le pourcentage doit être compris entre 1 et 10 !'}</FormText>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <FormGroup>
                                        <FormLabel>
                                            <b>Margin coin utilisé: </b> {methods.getValues('order.marginCoin')}
                                        </FormLabel>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Col>
                        <Accordion>
                            <Accordion.Item eventKey="0">
                                <Accordion.Header as={'h3'}>Préferences avancées (non recommandé pour les débutants)</Accordion.Header>
                                <Accordion.Body style={{ border: 'none' }}>
                                    <Row>
                                        <Col xs={12} md={6}>
                                            <Strategie />
                                        </Col>
                                        <Col xs={12} md={{offset: 1, span: 5}}>
                                            <BaseCoinAuthorized />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={12}>
                                            <FormGroup>
                                                <FormLabel>
                                                    <b>Le levier est calculé pour chaque trade pour être au plus proche de la SL.</b>
                                                </FormLabel>
                                            </FormGroup>
                                        </Col>
                                        <Col xs={12} lg={8} xl={6}>
                                            <FormGroup>
                                                <div className="form-title">Taille des TPs (en % du montant total)</div>
                                                <Controller
                                                    control={methods.control}
                                                    name="order.TPSize"
                                                    rules={{
                                                        validate: (value) => {
                                                            const values = Object.values(value)
                                                            let lineError = []
                                                            let index = 0
                                                            for (const value of values) {
                                                                if (!value && value !== 0) continue
                                                                index++
                                                                let total = 0
                                                                for (const key in value) {
                                                                    total += value[key] * 100 // si pas * 100, problème de virgules flottantes
                                                                }
                                                                if (total !== 100) {
                                                                    lineError.push(index)
                                                                }
                                                            }
                                                            if (lineError.length > 0) {
                                                                return 'La somme des lignes de TP suivantes doivent être égale à 1: ' + lineError.join(', ')
                                                            }
                                                            return true
                                                        },
                                                    }}
                                                    render={({ field }) => (
                                                        <>
                                                            {Object.keys(field.value).map((key: string) => (
                                                                <ControllerArrayNumber<IPreferencePayload>
                                                                    key={'preferences-tp-' + key}
                                                                    type="number"
                                                                    rules={{
                                                                        max: 1,
                                                                        min: 0,
                                                                    }}
                                                                    className={'preferences-tp'}
                                                                    label="TP"
                                                                    field={`order.TPSize.${key}`}
                                                                />
                                                            ))}
                                                            {errors?.order?.TPSize && (
                                                                <Col xs={12}>
                                                                    <div className="text-danger">
                                                                        {
                                                                            /* @ts-ignore */
                                                                            errors.order.TPSize.message as string
                                                                        }
                                                                    </div>
                                                                </Col>
                                                            )}
                                                        </>
                                                    )}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                        <Col xs={12} className="submit-form">
                            <Button variant="primary" type="submit" size="sm">
                                Enregistrer
                            </Button>
                        </Col>
                        {success && (
                            <Col xs={12} className="text-center">
                                <FormText className="text-success">Préférences enregistrées</FormText>
                            </Col>
                        )}
                    </Row>
                </Form>
            </FormProvider>
        </Container>
    )
}

export default Preferences
