import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ToastContainer, toast, Flip } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'
import axiosClient from '../../axiosClient'
import { useEffect } from 'react'
import { Button, Card, CardBody, CardText, Col, Container, FormControl, FormLabel, Row } from 'react-bootstrap'
import { useAuth } from '../../hooks/AuthContext'

const Login = (): JSX.Element => {
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
        let params = {
            email: data.email,
            password: data.password,
        }
        const response = await axiosClient.post('/auth/login', params)

        if (!response.data.success) {
            toast.error(response.data.error, {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                progress: 0,
                toastId: 'my_toast',
            })
        } else {
            toast.success(response.data.message, {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                progress: 0,
                toastId: 'my_toast',
            });
            console.log('response.data.access_token', response.data.access_token)
            setToken(response.data.access_token);
            navigate('/home', { replace: true })
        }
    }

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
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
                                </form>
                            </CardBody>
                        </Col>
                    </Card>
                </Row>
            </Container>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar
                closeOnClick
                rtl={false}
                pauseOnFocusLoss={false}
                draggable={false}
                pauseOnHover
                limit={1}
                transition={Flip}
            />
        </>
    )
}
export default Login
