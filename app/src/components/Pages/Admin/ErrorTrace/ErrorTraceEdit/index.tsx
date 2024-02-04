import { useEffect, useState } from 'react'
import { Button, Col, Container, Form, Row } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router'
import { IErrorTraceService } from '../error-trace.interface'
import axiosClient from '../../../../../axiosClient'
import { IUser } from '../../../../../interfaces/user.interface'
import Loader from '../../../../utils/Loader'
import ReactJson from 'react-json-view'

const ErrorTraceEdit = () => {
    const [errorTrace, setErrorTrace] = useState<IErrorTraceService<IUser>>()
    let { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        ;(async () => {
            const response = await axiosClient.get<IErrorTraceService<IUser>>('/error-trace/' + id)
            setErrorTrace(response.data)
        })()
    }, [])

    const handleValidate = async () => {
        await axiosClient.post(`/error-trace/${id}/finish`)
        navigate('/admin/error-trace');
    }

    if (!errorTrace) return <Loader />

    return (
        <Container className="error-trace-edit">
            <h2>Détail d'une erreur</h2>
            <Button onClick={handleValidate} className="mb-3">
                Marquer comme terminé
            </Button>
            <Row>
                <Col xs={12}>
                    <Form.Label>
                        Prénom NOM: {errorTrace.userId.lastname} {errorTrace.userId.firstname}
                    </Form.Label>
                </Col>
                <Col xs={12}>
                    <Form.Label>Email: {errorTrace.userId.email}</Form.Label>
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <Form.Label>Importance: {errorTrace.severity}</Form.Label>
                </Col>
                <Col xs={12}>
                    <Form.Label>Nom de la fonction: {errorTrace.functionName}</Form.Label>
                </Col>
                <Col xs={12}>
                    <Form.Label>Contexte:</Form.Label>
                    <ReactJson theme={'brewer'} src={errorTrace.context} />
                </Col>
            </Row>
        </Container>
    )
}

export default ErrorTraceEdit
