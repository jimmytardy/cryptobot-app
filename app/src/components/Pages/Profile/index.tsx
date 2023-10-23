import {
    Accordion,
    Button,
    Col,
    Container,
    Form,
    FormCheck,
    FormControl,
    FormLabel,
    FormText,
    Row,
} from 'react-bootstrap'
import { IUserConfig, useAuth } from '../../../hooks/AuthContext'
import './index.scss'
import { useEffect, useState } from 'react'
import axiosClient from '../../../axiosClient'
import { ArrowClockwise, InfoCircle } from 'react-bootstrap-icons'
import { useForm, useFormState } from 'react-hook-form'
import Positions, { BitgetPosition } from './Positions'

interface BitgetProfile {
    available: number
    totalPnL: number
    unrealizedPL: number
    positions: BitgetPosition[]
}

const Profile = () => {
    const { user, setUserOrderConfig } = useAuth()
    const [bitGetProfile, setBitgetProfile] = useState<BitgetProfile>()
    const [success, setSuccess] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const [fieldActivate, setFieldActivate] = useState<{
        quantity: boolean
        pourcentage: boolean
    }>({
        quantity: false,
        pourcentage: false,
    })
    const { reset, handleSubmit, register, setValue, getValues, control } =
        useForm<IUserConfig>()
    const { errors } = useFormState({ control })

    const loadBitGetProfile = async () => {
        setIsLoading(true)
        const profile = await axiosClient.get('/bitget/profile')
        setBitgetProfile(profile.data)
        setIsLoading(false)
    }

    useEffect(() => {
        loadBitGetProfile()
    }, [])

    useEffect(() => {
        if (user.orderConfig) {
            reset(user.orderConfig)
            setFieldActivate({
                quantity: Boolean(user.orderConfig.quantity),
                pourcentage: Boolean(user.orderConfig.pourcentage),
            })
        }
    }, [bitGetProfile])

    const handleCheckboxDisabledChange = (
        field: 'quantity' | 'pourcentage',
    ) => {
        setFieldActivate((oldFieldActivate) => {
            const activate = !oldFieldActivate[field]
            let newValue: undefined | number = undefined
            if (activate) {
                if (field === 'quantity') {
                    newValue = Number(bitGetProfile?.totalPnL.toFixed())
                } else {
                    newValue = 4
                }
            }
            setValue(field, newValue)
            return { ...oldFieldActivate, [field]: activate }
        })
    }

    const submitConfig = async (data: IUserConfig) => {
        axiosClient.post('/user/config', data).then((response) => {
            if (response.data.success) {
                setUserOrderConfig(data)
                setSuccess(true)
            }
        })
    }

    return (
        <Container className="profile">
            <Row>
                <Col xs={12}>
                    <div className="form-title">
                        <b>Profil</b>
                    </div>
                </Col>
                <Col xs={12}>
                    <FormText>
                        Nom:{' '}
                        <b>
                            {user.firstname} {user.lastname}
                        </b>
                    </FormText>
                </Col>
                <Col xs={12}>
                    <FormText>
                        Email: <b>{user.email}</b>
                    </FormText>
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <div className="form-title">
                        <b>Solde</b>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={loadBitGetProfile}
                        >
                            <ArrowClockwise size={15} />
                        </Button>
                    </div>
                </Col>
                {isLoading || !bitGetProfile ? (
                    <div>Chargement du profil bitget en cours...</div>
                ) : (
                    <>
                        <Col xs={12}>
                            <FormText>
                                Total:{' '}
                                <b>{bitGetProfile.totalPnL.toFixed(2)} USDT</b>
                            </FormText>
                        </Col>
                        <Col xs={12}>
                            <FormText>
                                Disponible:{' '}
                                <b>{bitGetProfile.available.toFixed(2)} USDT</b>
                            </FormText>
                        </Col>
                        <Col xs={12}>
                            <FormText>
                                En cours:{' '}
                                <b>
                                    {bitGetProfile.unrealizedPL.toFixed(2)} USDT
                                </b>
                            </FormText>
                        </Col>
                        <Col xs={12}>
                            <Form onSubmit={handleSubmit(submitConfig)}>
                                <Row>
                                    {(fieldActivate.pourcentage ||
                                        fieldActivate.quantity) && (
                                        <Col xs={12} className="warning-config">
                                            <InfoCircle size={25} />
                                            Attention: La configuration actuelle
                                            ne correspond pas à la configuration
                                            par défaut.
                                        </Col>
                                    )}
                                    <Col xs={12}>
                                        <FormLabel>
                                            <b>Quantité utilisé: </b>
                                        </FormLabel>
                                        <FormCheck
                                            type="switch"
                                            label="Activer/Désactiver"
                                            defaultChecked={Boolean(
                                                getValues('quantity'),
                                            )}
                                            onChange={() =>
                                                handleCheckboxDisabledChange(
                                                    'quantity',
                                                )
                                            }
                                        />
                                        <FormControl
                                            type="number"
                                            size="sm"
                                            disabled={!fieldActivate.quantity}
                                            {...register('quantity', {
                                                max: Number(
                                                    bitGetProfile.totalPnL.toFixed(),
                                                ),
                                                valueAsNumber: true,
                                            })}
                                        />
                                        <FormText className="text-danger">
                                            {errors.quantity &&
                                                'La quantité ne peut pas être supérieur au solde total !'}
                                        </FormText>
                                    </Col>
                                    <Col xs={12}>
                                        <FormLabel>
                                            <b>Pourcentage / Ordre: </b>
                                            <FormCheck
                                                type="switch"
                                                label="Activer/Désactiver"
                                                defaultChecked={Boolean(
                                                    getValues('pourcentage'),
                                                )}
                                                onChange={() =>
                                                    handleCheckboxDisabledChange(
                                                        'pourcentage',
                                                    )
                                                }
                                            />
                                        </FormLabel>
                                        <FormControl
                                            size="sm"
                                            type="number"
                                            disabled={!fieldActivate.pourcentage}
                                            {...register('pourcentage', {
                                                min: 1,
                                                max: 100,
                                                valueAsNumber: true,
                                            })}
                                        />
                                        <FormText className="text-danger">
                                            {errors.pourcentage &&
                                                'Le pourcentage doit être compris entre 1 et 100 !'}
                                        </FormText>
                                    </Col>
                                    <Col xs={12} className="submit-form">
                                        <Button
                                            variant="primary"
                                            type="submit"
                                            size="sm"
                                        >
                                            Enregistrer
                                        </Button>
                                    </Col>
                                    {success && (
                                        <Col xs={12}>
                                            <FormText className="text-success">
                                                Configuration enregistrée
                                            </FormText>
                                        </Col>
                                    )}
                                </Row>
                            </Form>
                        </Col>
                        <Positions positions={bitGetProfile.positions} />
                    </>
                )}
            </Row>
        </Container>
    )
}

export default Profile
