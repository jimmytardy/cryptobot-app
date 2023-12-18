import React, { useEffect, useState } from 'react'
import { Button, Col, Container, FormCheck, FormGroup, FormLabel, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import axiosClient from '../../../../axiosClient'
import { AppConfigPayload } from './app-config.interface'
import Loader from '../../../utils/Loader'

const AppConfig = () => {
    const { register, reset, handleSubmit } = useForm<AppConfigPayload>()
    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
        ;(async () => {
            const response = await axiosClient.get<AppConfigPayload>('/app-config')
            reset(response.data)
            setIsLoading(false)
        })()
    }, []);

    if (isLoading) return <Loader />

    const onSubmitData = async (data: AppConfigPayload) => {
        await axiosClient.post('/app-config', data)
    }

    return (
        <Container>
            <h2>App Config</h2>
            <form onSubmit={handleSubmit(onSubmitData)}>
                <h3>Configuration du bot</h3>
                <Row>
                    <div className='form-title'>Droits du bot</div>
                    <Col xs={12} className='mt-2'>
                        <FormGroup>
                            <FormCheck type="switch" label="Placer un ordre" {...register('bot.placeOrder')} />
                        </FormGroup>
                    </Col>
                    <Col xs={12} className='mt-2'>
                        <FormGroup>
                            <FormCheck type="switch" label="Modifier un ordre" {...register('bot.updateOrder')} />
                        </FormGroup>
                    </Col>
                    <Col xs={12} className='mt-2'>
                        <FormGroup>
                            <FormCheck type="switch" label="Annuler un ordre" {...register('bot.cancelOrder')} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row className='mt-4'>
                    <Col className='text-center'>
                        <Button type="submit" style={{ width: 150 }}>
                            Enregistrer
                        </Button>
                    </Col>
                </Row>
            </form>
        </Container>
    )
}

export default AppConfig
