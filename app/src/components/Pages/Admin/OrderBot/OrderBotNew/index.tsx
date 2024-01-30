import { Button, Col, Container, Form, Row } from 'react-bootstrap'
import { FormProvider, useForm } from 'react-hook-form'
import { IOrderBot } from '../order-bot.interface'
import PlaceOrderForm from '../../../../PlaceOrderForm'
import { useState } from 'react'
import axiosClient from '../../../../../axiosClient'

const OrderBotNew = () => {
    const methods = useForm<IOrderBot>({
        defaultValues: {
            baseCoin: '',
            side: 'long',
            messageId: '-1',
            TPs: [],
            PEs: [],
            SL: 0,
        },
    });
    const [errors, setErrors] = useState<string[]>([]);
    const [message, setMessage] = useState<string>();

    const submitData = async (data: IOrderBot) => {
        const errors = [];
        if (data.PEs.filter((pe) => pe).length === 0) errors.push('Au minimum un PE doit être défini');
        if (data.TPs.filter((tp) => tp).length === 0) errors.push('Au minimum un TP doit être défini');
        if (data.SL < 0) errors.push('Le SL doit être positif');
        if (errors.length > 0) return setErrors(errors);
        setErrors([]);
        try {
            await axiosClient.post('/order-bot/new', data);
            setMessage('Ordre créé avec succès');
        } catch (e) {
            console.error(e);
        }
    }
    return (
        <Container>
            <h2>Créer un ordre de bot</h2>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(submitData)}>
                    <PlaceOrderForm />
                    <Row>
                        <Col xs={4} md={2}>
                            <Form.Label htmlFor="side">Message Id</Form.Label>
                            <Form.Control {...methods.register('messageId', { required: true, min: 0 })} type="number" />
                            {methods.formState.errors.messageId && <p className='text-danger'>L'id doit être positif</p>}
                        </Col>
                        <Col xs={12} className='mt-4 text-center'>
                            <Button type="submit">Créer un ordre</Button>
                            {errors.map((error, index) => <p key={index} className='text-danger'>{error}</p>)}
                            {message && <p className='text-success'>{message}</p>}
                        </Col>
                    </Row>
                </form>
            </FormProvider>
        </Container>
    )
}

export default OrderBotNew
