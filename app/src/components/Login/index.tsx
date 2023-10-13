import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ToastContainer, toast, Flip } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'
import axiosClient from '../../axios.config'

const Login = (): JSX.Element => {
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()

    const login = (data: any) => {
        let params = {
            email: data.email,
            password: data.password,
        }
        axiosClient
            .post('/auth/login', params)
            .then(function (response) {
                //   IF EMAIL ALREADY EXISTS
                if (response.data.success === false) {
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
                    })
                    localStorage.setItem('token', response.data.access_token)
                    navigate('/', { replace: true })
                }
            })
            .catch(function (error) {
                console.log(error)
            })
    }

    return (
        <>
            <div className="container">
                <div
                    className="row d-flex justify-content-center align-items-center"
                    style={{ height: '100vh' }}
                >
                    <div className="card mb-3">
                        <div className="col-md-12">
                            <div className="card-body">
                                <form
                                    autoComplete="off"
                                    onSubmit={handleSubmit(login)}
                                >
                                    <div className="mb-3 mt-4">
                                        <label className="form-label">
                                            Email
                                        </label>
                                        <input
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
                                        <label className="form-label">
                                            Mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control shadow-none"
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
                                        <button
                                            className="btn btn-outline-primary text-center shadow-none mb-3"
                                            type="submit"
                                        >
                                            Se connecter
                                        </button>
                                        <p className="card-text pb-2">
                                            Vous avez un compte ? <br />
                                            <Link
                                                style={{
                                                    textDecoration: 'none',
                                                }}
                                                to={'/register'}
                                            >
                                                S'inscrire
                                            </Link>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
