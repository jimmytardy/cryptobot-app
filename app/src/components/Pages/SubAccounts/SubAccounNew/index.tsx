import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import 'react-toastify/dist/ReactToastify.min.css'
import { Button, Col, Container, FormControl, FormGroup, FormLabel, Row } from 'react-bootstrap'
import { useState } from 'react'
import { IUser, IUserPayload } from '../../../../interfaces/user.interface'
import axiosClient from '../../../../axiosClient'
import { ISubAccountPayload } from '../sub-account.interface'
import { useAuth } from '../../../../hooks/AuthContext'
import { hasSubAccount } from '../../../../utils'

const SubAccounNew = () => {
    const { user } = useAuth();
    if (!hasSubAccount(user)) return <Navigate to="/" replace={true} />
    const {
        register,
        handleSubmit,
    } = useForm<ISubAccountPayload>({
        defaultValues: {
            bitget: {
                api_key: '',
                api_secret_key: '',
                api_pass: '',
            },
        },
    })
    const [subAccountCreated, setAccountCreated] = useState<IUser>();
    const [error, setError] = useState<string>()

    const navigate = useNavigate()

    const submitData = async (data: ISubAccountPayload) => {
        let params: any = {
            bitget: data.bitget
        }
        try {
            const response = await axiosClient.post<IUser>('/user/sub-account', params)
            setAccountCreated(response.data)
        } catch (e: any) {
            setError(e.response.data.message)
        }
    }

    const connectTo = async () => {
        if (subAccountCreated) {
            const response = await axiosClient.post('/auth/sub-account/connect-in', { userId: subAccountCreated._id })
            localStorage.setItem('token', response.data.access_token)
            navigate('/', { replace: true })
        } else {
            setError('Veuillez créer un sous-compte avant de vous connecter');
        }
    }

    return (
        <Container>
            <h2>Création d'un sous-compte</h2>
            {subAccountCreated ? (
                <Row>
                    <Col xs={12}>
                        <FormLabel>
                            Email de connexion: <b>{subAccountCreated.email}</b>
                        </FormLabel>
                    </Col>
                    <Col xs={12}>
                        <FormLabel>
                            Mot de passe: Le mot de passe est le même que le compte principal
                        </FormLabel>
                    </Col>
                    <Col xs={12}>
                        <Button variant="outline-primary" className="text-center shadow-none mb-3" onClick={connectTo}>
                            Se connecter
                        </Button>
                    </Col>
                </Row>
            ) : (
                <form autoComplete="off" onSubmit={handleSubmit(submitData)}>
                    <Row>
                        <Col xs={12}>
                            <FormLabel>
                                Information sur votre clé API. <b>Il est interdit de</b>:
                                <ul>
                                    <li>Trader sur un compte utilisé par le bot</li>
                                    <li>Mettre 2 bot sur le même compte</li>
                                </ul>
                                Vous pouvez diversifier vos stratégies en créant des sous-comptes bitget et en y associant une clé API.
                            </FormLabel>
                        </Col>
                        <Col xs={12} md={8} lg={6} xl={4}>
                            <FormGroup className='mt-4'>
                                <FormLabel>API Key</FormLabel>
                                <FormControl
                                    type="text"
                                    size="sm"
                                    id="api_key"
                                    {...register('bitget.api_key', {
                                        required: 'API Key est obligatoire !',
                                    })}
                                />
                            </FormGroup>
                            <FormGroup className='mt-4'>
                                <FormLabel>API Secret Key</FormLabel>
                                <FormControl
                                    type="password"
                                    size="sm"
                                    id="api_secret_key"
                                    {...register('bitget.api_secret_key', {
                                        required: 'API Secret Key est obligatoire !',
                                    })}
                                />
                            </FormGroup>
                            <FormGroup className='mt-4'>
                                <FormLabel>API Pass</FormLabel>
                                <FormControl
                                    type="password"
                                    size="sm"
                                    id="api_pass"
                                    {...register('bitget.api_pass', {
                                        required: 'API Pass Key est obligatoire !',
                                    })}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row className="mt-4">
                        <Col className="text-danger">{error}</Col>
                    </Row>
                    <div className="text-center mt-4">
                        <Button variant="outline-primary" className="text-center shadow-none mb-3" type="submit">
                            Créer le sous-compte
                        </Button>
                    </div>
                </form>
            )
            }

        </Container >
    )
}

export default SubAccounNew;
