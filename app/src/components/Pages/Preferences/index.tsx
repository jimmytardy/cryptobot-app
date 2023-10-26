import { useEffect, useState } from 'react'
import {
    Controller,
    FormProvider,
    useForm,
    useFormState,
} from 'react-hook-form'
import axiosClient from '../../../axiosClient'
import Loader from '../../utils/Loader'
import {
    Button,
    Col,
    Container,
    Form,
    FormCheck,
    FormControl,
    FormGroup,
    FormLabel,
    FormText,
    Row,
} from 'react-bootstrap'
import { InfoCircle } from 'react-bootstrap-icons'
import ControllerArrayNumber from '../../utils/form/ControllerArrayNumber'
import './index.scss'

export type TPSizeType = { [x: string]: number[] }

export type LeviersSizeType = { minPrice: number; value: number }[]

interface IPreferencePayload {
    order: {
        pourcentage?: number
        quantity?: number
        TPSize: TPSizeType
        levierSize: LeviersSizeType
        marginCoin: string
    }
}

const Preferences = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const methods = useForm<IPreferencePayload>()
    const [success, setSuccess] = useState<boolean>(false)

    const [fieldActivate, setFieldActivate] = useState<{
        quantity: boolean
        pourcentage: boolean
    }>({
        quantity: false,
        pourcentage: false,
    })
    const { errors } = useFormState({ control: methods.control })

    useEffect(() => {
        ;(async () => {
            const preferences = await axiosClient.get('/user/preferences')
            methods.reset(preferences.data);
            setFieldActivate({
                quantity: Boolean(preferences.data.order.quantity),
                pourcentage: Boolean(preferences.data.order.pourcentage),
            });
            setIsLoading(false)
        })()
    }, []);

    const handleCheckboxDisabledChange = (
        field: 'quantity' | 'pourcentage',
    ) => {
        setFieldActivate((oldFieldActivate) => {
            const activate = !oldFieldActivate[field]
            let newValue: undefined | number = undefined
            if (activate) {
                if (field === 'quantity') {
                    newValue = 500
                } else {
                    newValue = 4
                }
            }
            methods.setValue(`order.${field}`, newValue)
            return { ...oldFieldActivate, [field]: activate }
        })
    }

    const submitPreference = async (data: IPreferencePayload) => {
        await axiosClient.post('/user/preferences', data)
        setSuccess(true)
    }

    if (isLoading) return <Loader />

    return (
        <Container className="preferences">
            <h1 className="text-center">Préférences</h1>
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(submitPreference)}>
                    <Row>
                        <Col xs={12} md={5}>
                            <div className="form-title">Valeur par ordre</div>
                            <Row className="mb-4">
                                {(fieldActivate.pourcentage ||
                                    fieldActivate.quantity) && (
                                    <Col xs={12} className="warning-config">
                                        <InfoCircle size={25} />
                                        Attention: La configuration actuelle ne
                                        correspond pas à la configuration par
                                        défaut.
                                    </Col>
                                )}
                                <Col xs={12}>
                                    <FormGroup>
                                        <FormLabel>
                                            <b>Quantité utilisé: </b>
                                        </FormLabel>
                                        <FormCheck
                                            type="switch"
                                            label="Activer/Désactiver"
                                            defaultChecked={Boolean(
                                                methods.getValues(
                                                    'order.quantity',
                                                ),
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
                                            {...methods.register(
                                                'order.quantity',
                                                {
                                                    valueAsNumber: true,
                                                },
                                            )}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs={12}>
                                    <FormGroup>
                                        <FormLabel>
                                            <b>Pourcentage / Ordre: </b>
                                            <FormCheck
                                                type="switch"
                                                label="Activer/Désactiver"
                                                defaultChecked={Boolean(
                                                    methods.getValues(
                                                        'order.pourcentage',
                                                    ),
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
                                            disabled={
                                                !fieldActivate.pourcentage
                                            }
                                            {...methods.register(
                                                'order.pourcentage',
                                                {
                                                    min: 1,
                                                    max: 100,
                                                    valueAsNumber: true,
                                                },
                                            )}
                                        />
                                        <FormText className="text-danger">
                                            {errors?.order?.pourcentage &&
                                                'Le pourcentage doit être compris entre 1 et 100 !'}
                                        </FormText>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <FormGroup>
                                        <FormLabel>
                                            <b>Margin coin utilisé: </b>{' '}
                                            {methods.getValues(
                                                'order.marginCoin',
                                            )}
                                        </FormLabel>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <FormGroup>
                                        <FormLabel>
                                            <b>Levier utilisé: </b>
                                        </FormLabel>
                                        {methods
                                            .getValues('order.levierSize')
                                            .map((levier, index) => (
                                                <Row
                                                    key={
                                                        'order.levier-' + index
                                                    }
                                                >
                                                    <Col xs={12}>
                                                        <FormLabel>
                                                            <b>
                                                                {levier.value}x
                                                            </b>
                                                            : à partir du prix
                                                            de la crypto de{' '}
                                                            <b>
                                                                {
                                                                    levier.minPrice
                                                                }{' '}
                                                                USDT
                                                            </b>
                                                        </FormLabel>
                                                    </Col>
                                                </Row>
                                            ))}
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row className="stategie">
                                <Col xs={12}>
                                    <FormGroup>
                                        <FormLabel>
                                            <b>Stratégie utilisée: </b>
                                        </FormLabel>
                                        <div className="stategie-part">
                                            <div className="stategie-action">
                                                Lorsque TP1 est pris
                                            </div>
                                            <ol className="stategie-list">
                                                <li>
                                                    On supprime l'autre PE s'il
                                                    n'a pas été pris
                                                </li>
                                                <li>
                                                    On met le stop loss au PE le
                                                    plus bas (PE de base s'il
                                                    n'y en a qu'un seul)
                                                </li>
                                            </ol>
                                        </div>
                                        <div className="stategie-part">
                                            <div className="stategie-action">
                                                Lorsque TP2 est pris
                                            </div>
                                            <ol className="stategie-list">
                                                <li>
                                                    On met le stop loss au PE le
                                                    plus haut
                                                </li>
                                            </ol>
                                        </div>
                                        <div className="stategie-part">
                                            <div className="stategie-action">
                                                Lorsque que TP3 ou plus est pris
                                            </div>
                                            <ol className="stategie-list">
                                                <li>
                                                    On met le stop loss au TP
                                                    pris -2
                                                </li>
                                            </ol>
                                        </div>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Col>
                        <Col xs={12} md={{ offset: 1, span: 5 }}>
                            <FormGroup>
                                <div className="form-title">
                                    Taille des TPs (en % du montant total)
                                </div>
                                <Controller
                                    control={methods.control}
                                    name="order.TPSize"
                                    rules={{
                                        validate: (value) => {
                                            const values = Object.values(value)
                                            let lineError = []
                                            let index = 0
                                            for (const value of values) {
                                                index++
                                                let total = 0
                                                for (const key in value) {
                                                    total += value[key] * 100 // si pas * 100, problème de virgules flottantes
                                                }
                                                if (total !== 100) {
                                                    console.log(
                                                        'index',
                                                        index,
                                                        total,
                                                    )
                                                    lineError.push(index)
                                                }
                                            }
                                            if (lineError.length > 0) {
                                                return (
                                                    'La somme des lignes de TP suivantes doivent être égale à 1: ' +
                                                    lineError.join(', ')
                                                )
                                            }
                                            return true
                                        },
                                    }}
                                    render={({ field }) => (
                                        <>
                                            {Object.keys(field.value).map(
                                                (key: string) => (
                                                    <ControllerArrayNumber<IPreferencePayload>
                                                        key={
                                                            'preferences-tp-' +
                                                            key
                                                        }
                                                        type="number"
                                                        rules={{
                                                            max: 1,
                                                            min: 0,
                                                        }}
                                                        className={
                                                            'preferences-tp'
                                                        }
                                                        label="TP"
                                                        field={`order.TPSize.${key}`}
                                                    />
                                                ),
                                            )}
                                            {errors?.order?.TPSize && (
                                                <Col xs={12}>
                                                    <div className="text-danger">
                                                        {
                                                            /* @ts-ignore */
                                                            errors.order.TPSize
                                                                .message as string
                                                        }
                                                    </div>
                                                </Col>
                                            )}
                                        </>
                                    )}
                                />
                            </FormGroup>
                        </Col>
                        <Col xs={12} className="submit-form">
                            <Button variant="primary" type="submit" size="sm">
                                Enregistrer
                            </Button>
                        </Col>
                        {success && (
                            <Col xs={12} className='text-center'>
                                <FormText className="text-success">
                                    Préférences enregistrées
                                </FormText>
                            </Col>
                        )}
                    </Row>
                </Form>
            </FormProvider>
        </Container>
    )
}

export default Preferences
