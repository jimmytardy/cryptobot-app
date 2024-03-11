import { useEffect, useState } from 'react'
import { Button, Col, Container, FormCheck, FormControl, FormLabel, Row } from 'react-bootstrap'
import { FormProvider, useForm } from 'react-hook-form'
import { Navigate, useNavigate, useParams } from 'react-router'
import Loader from '../../../../utils/Loader'
import { IStrategyPayload, defaultStrategy } from '../../../../../interfaces/stategy.interface'
import StrategyForm from '../../../../StrategyForm'
import axiosClient from '../../../../../axiosClient'


const StategieEdit = () => {
    const methods = useForm<IStrategyPayload>({
        defaultValues: defaultStrategy,
    });
    const [loading, setLoading] = useState<boolean>(true)
    const [message, setMessage] = useState<string>('')
    const navigate = useNavigate()
    
    let { id } = useParams()
    if (!id) return <Navigate to={'/admin/strategy'} />

    useEffect(() => {
        if (id !== 'new') {
            (async () => {
                const response = await axiosClient.get('/strategy/' + id)
                methods.reset(response.data);
                setLoading(false)
            })();
        } else setLoading(false)
    }, [])

    if (loading) return <Loader />

    const submitData = async (data: IStrategyPayload) => {
        try {
            await axiosClient.post('/strategy/' + id, data);
            if (id === 'new') {
                navigate('/admin/strategy');
            } else {
                setMessage('La stratégie a bien été modifiée')
            }
        } catch (e: any) {
            setMessage(e.message || e.data?.message || 'Une erreur est survenue');
        }
    }

    return (
        <Container>
            <h2>{methods.getValues('_id') ? 'Modification' : 'Création'} d'une stratégie</h2>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(submitData)}>
                    <Row>
                        <Col xs={12} md={6} lg={4}>
                            <FormCheck id="active" {...methods.register('active')} type="switch" label="Activer la stratégie" />
                            <FormCheck id="default" {...methods.register('default')} type="switch" label="Stratégie par défaut" />
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={6} lg={4}>
                            <FormLabel htmlFor="name">Nom</FormLabel>
                            <FormControl
                                id="name"
                                {...methods.register('name', {
                                    required: 'Le nom est requis!',
                                    min: 3
                                })}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} lg={6}>
                            <FormLabel>Description</FormLabel>
                            <FormControl
                                as="textarea"
                                rows={3}
                                className="form-control shadow-none"
                                id="description"
                                {...methods.register('description', {
                                    required: 'Le nom est requis!',
                                    min: 3
                                })}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <StrategyForm name="strategy" />
                    </Row>
                    <Row className='p-5'>
                        {message && <p className='text-success'>{message}</p>}
                        <Button type='submit' className='m-auto' style={{ width: '150px'}}>Sauvegarder</Button>
                    </Row>
                </form>
            </FormProvider>
        </Container>
    )
}
export default StategieEdit
