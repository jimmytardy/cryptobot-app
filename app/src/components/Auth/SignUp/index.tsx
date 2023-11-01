import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ToastContainer, toast, Flip } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'
import {
    Button,
    Card,
    CardBody,
    CardText,
    CardTitle,
    Col,
    Container,
    FormControl,
    FormGroup,
    FormLabel,
    Row,
} from 'react-bootstrap'
import { IUserPayload } from '../../../interfaces/user.interface'
import axiosClient from '../../../axiosClient'
import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'

const SignUp = () => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<IUserPayload>();

    const [error, setError] = useState<string>();

    const navigate = useNavigate()

    useEffect(() => {
        const submitOnEnter = (e: any) => {
            if (e.key === 'Enter') {
                handleSubmit(submitData);
            }
        };
        document.addEventListener('keydown', submitOnEnter)
        return () => {
            document.removeEventListener('keydown', submitOnEnter)
        }
    }, []);

    const submitData = async (data: IUserPayload) => {
        let params = {
            firstname: data.firstname,
            lastname: data.lastname,
            email: data.email,
            password: data.password,
            bitget: data.bitget,
        }
        try {
            const response = await axiosClient.post('/auth/signup', params);
            reset();
            localStorage.setItem('token', response.data.access_token)
            navigate('/', { replace: true })
        } catch (e: any) { 
            setError(e.response.data.message);
        }
    }
    return (
        <Container>
            <Row
                className="justify-content-center align-items-center"
                style={{ height: '100vh' }}
            >
                <Card
                    className="mb-3 mt-3 rounded"
                    style={{ maxWidth: '500px' }}
                >
                    <Col md={12}>
                        <CardBody>
                            <CardTitle className="text-center text-secondary mt-3 mb-3">
                                S'inscrire
                            </CardTitle>
                            <form
                                autoComplete="off"
                                onSubmit={handleSubmit(submitData)}
                            >
                                <FormGroup>
                                    <Row>
                                        <Col md={6}>
                                            <FormLabel>Nom</FormLabel>
                                            <FormControl
                                                {...register('firstname', {
                                                    required:
                                                        'Nom est obligatoire !',
                                                })}
                                                size="sm"
                                                type="text"
                                            />
                                            {errors.firstname && (
                                                <p
                                                    className="text-danger"
                                                    style={{ fontSize: 14 }}
                                                >
                                                    {/* @ts-ignore */}
                                                    {
                                                        errors.firstname
                                                            .message
                                                    }
                                                </p>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            <FormLabel>Prénom</FormLabel>
                                            <FormControl
                                                size="sm"
                                                type="text"
                                                {...register('lastname', {
                                                    required:
                                                        'Prénom  est obligatoire !',
                                                })}
                                            />
                                            {errors.lastname && (
                                                <p
                                                    className="text-danger"
                                                    style={{ fontSize: 14 }}
                                                >
                                                    {/* @ts-ignore */}
                                                    {
                                                        errors.lastname
                                                            .message
                                                    }
                                                </p>
                                            )}
                                        </Col>
                                    </Row>
                                </FormGroup>
                                <FormGroup>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl
                                        type="email"
                                        size="sm"
                                        {...register('email', {
                                            required: 'Email is required!',
                                        })}
                                    />
                                    {errors.email && (
                                        <p
                                            className="text-danger"
                                            style={{ fontSize: 14 }}
                                        >
                                            {/* @ts-ignore */}
                                            {errors.email.message}
                                        </p>
                                    )}
                                </FormGroup>
                                <FormGroup>
                                    <FormLabel>Mot de passe</FormLabel>
                                    <FormControl
                                        type="password"
                                        size="sm"
                                        {...register('password', {
                                            required:
                                                'Mot de passe est obligatoire !',
                                        })}
                                    />
                                    {errors.password && (
                                        <p
                                            className="text-danger"
                                            style={{ fontSize: 14 }}
                                        >
                                            {/* @ts-ignore */}
                                            {errors.password.message}
                                        </p>
                                    )}
                                </FormGroup>
                                <FormGroup className='mt-5'>
                                    <FormLabel>
                                        Information sur bitget
                                    </FormLabel>
                                    <Row>
                                        <Col md={6}>
                                            <FormLabel>API Key</FormLabel>
                                            <FormControl
                                                type="text"
                                                size="sm"
                                                id="api_key"
                                                {...register(
                                                    'bitget.api_key',
                                                    {
                                                        required:
                                                            'API Key est obligatoire !',
                                                    },
                                                )}
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <FormLabel>
                                                API Secret Key
                                            </FormLabel>
                                            <FormControl
                                                type="password"
                                                size="sm"
                                                id="api_secret_key"
                                                {...register(
                                                    'bitget.api_secret_key',
                                                    {
                                                        required:
                                                            'API Secret Key est obligatoire !',
                                                    },
                                                )}
                                            />
                                        </Col>
                                        <Col xs={6}>
                                            <FormLabel>API Pass</FormLabel>
                                            <FormControl
                                                type="text"
                                                size="sm"
                                                id="api_pass"
                                                {...register(
                                                    'bitget.api_pass',
                                                    {
                                                        required:
                                                            'API Pass Key est obligatoire !',
                                                    },
                                                )}
                                            />
                                        </Col>
                                    </Row>
                                </FormGroup>
                                <Row className='mt-4'>
                                    <Col className='text-danger'>
                                        {error}
                                    </Col>
                                </Row>
                                <div className="text-center mt-4">
                                    <Button
                                        variant="outline-primary"
                                        className="text-center shadow-none mb-3"
                                        type="submit"
                                    >
                                        S'inscrire
                                    </Button>
                                    <CardText>
                                        Vous avez déjà un compte <br />
                                        <Link
                                            style={{
                                                textDecoration: 'none',
                                            }}
                                            to={'/login'}
                                        >
                                            Connectez-vous
                                        </Link>
                                    </CardText>
                                </div>
                            </form>
                        </CardBody>
                    </Col>
                </Card>
            </Row>
        </Container>
    )
}

export default SignUp
