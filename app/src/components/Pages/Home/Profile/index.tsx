import {
    Button,
    Col,
    Container,
    FormCheck,
    Form,
    FormText,
    Row,
} from 'react-bootstrap'
import { useAuth } from '../../../../hooks/AuthContext'
import './index.scss'
import { useState } from 'react'
import axiosClient from '../../../../axiosClient'
import { useForm, useFormState } from 'react-hook-form'
import { IUserUpdatePayload } from '../../../../interfaces/user.interface'

const Profile = () => {
    const { user } = useAuth()

    const [message, setMessage] = useState<{
        type: 'success' | 'danger'
        message: string
    }>()
    const { handleSubmit, register, reset, watch, control } =
        useForm<IUserUpdatePayload>({
            defaultValues: {
                active: user.active,
            },
        })

    const formState = useFormState<IUserUpdatePayload>({ control })
    const active = watch('active')

    const submitProfile = async (data: IUserUpdatePayload) => {
        try {
            const result = await axiosClient.put('/user/profile', data)
            setMessage({
                type: 'success',
                message: result.data.message,
            })
            reset(data)
        } catch (error: any) {
            setMessage({
                type: 'danger',
                message: error.response.data.message,
            })
        }
    }

    return (
        <Container className="profile">
            <Row>
                <Form onSubmit={handleSubmit(submitProfile)}>
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
                    {user.role !== 'mainbot' && [
                        <Col xs={12}>
                            <FormText>
                                Abonnement:{' '}
                                <b>{user.subscription ? 'Actif' : 'Inactif'}</b>
                            </FormText>
                        </Col>,
                        <Col xs={12}>
                            <FormCheck
                                className="form-text"
                                type="checkbox"
                                label="Activer le bot"
                                {...register('active')}
                            />
                            {!active && (
                                <small className="text-danger">
                                    Attention, si cette case est décocher, le
                                    bot ne posera plus d'ordre
                                </small>
                            )}
                        </Col>,
                        <Col xs={12} className="mt-2">
                            <Button
                                disabled={!formState.isDirty}
                                size="sm"
                                type="submit"
                            >
                                Sauvegarder
                            </Button>
                        </Col>,
                        <Col xs={12} className="mt-2">
                            {message && (
                                <FormText className={'text-' + message.type}>
                                    {message.message}
                                </FormText>
                            )}
                        </Col>,
                    ]}
                </Form>
            </Row>
        </Container>
    )
}

export default Profile
