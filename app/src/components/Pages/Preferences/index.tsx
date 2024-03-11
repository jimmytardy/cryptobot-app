import { useEffect, useState } from 'react'
import { FormProvider, useForm, useFormState } from 'react-hook-form'
import axiosClient from '../../../axiosClient'
import Loader from '../../utils/Loader'
import {Button, Col, Container, Form, FormCheck, FormControl, FormGroup, FormLabel, FormText, Row } from 'react-bootstrap'
import './index.scss'
import Strategies from './Strategies'
import BaseCoinAuthorized from './BaseCoinAuthorized'
import { IOrderStrategySL, TPSizeType } from '../../../interfaces/stategy.interface'

export interface IPreferencePayload {
    bot: {
        pourcentage?: number
        quantity?: number
        TPSize: TPSizeType
        marginCoin: string
        strategy?: IOrderStrategySL
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
            const preferences: { data: IPreferencePayload } = await axiosClient.get('/user/preferences')
            methods.reset(preferences.data)
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
                                    <FormCheck type="switch" label="Désactiver / Activer" {...methods.register('bot.automaticUpdate')} />
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
                                            {...methods.register('bot.quantity', {
                                                valueAsNumber: true,
                                                min: 0,
                                            })}
                                        />
                                    </FormGroup>
                                    <FormText className="text-danger">{errors?.bot?.pourcentage && 'Le solde doit être supérieur à 0 !'}</FormText>
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
                                            {...methods.register('bot.pourcentage', {
                                                min: 1,
                                                max: 10,
                                                valueAsNumber: true,
                                            })}
                                        />
                                        <FormText className="text-danger">{errors?.bot?.pourcentage && 'Le pourcentage doit être compris entre 1 et 10 !'}</FormText>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Col>
                        <Col xs={12} md={{ offset: 1, span: 6 }}>
                            <BaseCoinAuthorized />
                        </Col>
                        <Row>
                            <Col xs={12}>
                                <FormGroup>
                                    <FormLabel>
                                        <b>Le levier est calculé pour chaque trade pour être au plus proche de la SL.</b>
                                    </FormLabel>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                <Strategies<IPreferencePayload> name={'bot.strategy'} />
                            </Col>
                        </Row>
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
