import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axiosClient from '../../../axiosClient'
import { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardText, Col, Container, FormControl, FormLabel, Row } from 'react-bootstrap'
import { useAuth } from '../../../hooks/AuthContext'

const Login = (): JSX.Element => {
    const [error, setError] = useState<string>();
    const { setToken } = useAuth();
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()

    useEffect(() => {
        const submitOnEnter = (e: any) => {
            if (e.key === 'Enter') {
                handleSubmit(login)
            }
        }
        document.addEventListener('keydown', submitOnEnter)
        return () => {
            document.removeEventListener('keydown', submitOnEnter)
        }
    }, [])

    const login = async (data: any) => {
        try {
            let params = {
                email: data.email,
                password: data.password,
            }
            const response = await axiosClient.post('/auth/login', params)
            setToken(response.data.access_token);
            navigate('/home', { replace: true })
        } catch (e) {
            setError("L'email et/ou le mot de passe sont incorrects");
        }
    }

    return (

        <Container>
            <Row
                className="justify-content-center align-items-center m-auto"
                style={{ height: '100vh', maxWidth: 600 }}
            >
                <Card className="mb-3">
                    <Col md={12}>
                        <CardBody>
                            <form
                                autoComplete="off"
                                onSubmit={handleSubmit(login)}
                            >
                                <div className="mb-3 mt-4">
                                    <FormLabel>
                                        Email
                                    </FormLabel>
                                    <FormControl
                                        type="email"
                                        className="form-control shadow-none"
                                        id="exampleFormControlInput1"
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
                                </div>
                                <div className="mb-3">
                                    <FormLabel>
                                        Mot de passe
                                    </FormLabel>
                                    <FormControl
                                        type="password"
                                        className="shadow-none"
                                        id="exampleFormControlInput2"
                                        {...register('password', {
                                            required:
                                                'Password is required!',
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
                                </div>
                                <div className="text-center mt-4 ">
                                    <Button
                                        variant="outline-primary"
                                        className="text-center shadow-none mb-3"
                                        type="submit"
                                    >
                                        Se connecter
                                    </Button>
                                    <CardText className="pb-2">
                                        Vous avez un compte ? <br />
                                        <Link
                                            style={{
                                                textDecoration: 'none',
                                            }}
                                            to={'/register'}
                                        >
                                            S'inscrire
                                        </Link>
                                    </CardText>
                                </div>
                                {error && (
                                    <div className="mb-3 text-danger">
                                        {error}
                                    </div>
                                )}
                            </form>
                        </CardBody>
                    </Col>
                </Card>
            </Row>
        </Container>
    )
}
export default Login
