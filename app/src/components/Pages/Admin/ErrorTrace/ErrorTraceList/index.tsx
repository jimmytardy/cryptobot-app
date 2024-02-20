import { useEffect, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import axiosClient from '../../../../../axiosClient'
import Loader from '../../../../utils/Loader'
import { useNavigate } from 'react-router'
import { IErrorTraceService } from '../error-trace.interface'
import { IUser } from '../../../../../interfaces/user.interface'
import dayjs from 'dayjs';
import { PencilSquare } from 'react-bootstrap-icons'

const ErrorTraceList = () => {
    const [errorsTrace, setErrorsTrace] = useState<IErrorTraceService<IUser>[]>()
    const navigate = useNavigate()
    useEffect(() => {
        ;(async () => {
            const response = await axiosClient.get('/error-trace')
            setErrorsTrace(response.data)
        })()
    }, [])

    const handleEdit = (id: string) => {
        navigate('/admin/error-trace/' + id)
    }

    const getLabelSeverity = (severity: string) => {
        switch (severity) {
            case 'immediate':
                return 'Urgent'
            case 'error':
                return 'Erreur'
            case 'warning':
                return 'Avertissement'
            case 'info':
                return 'Information'
            default:
                return 'Inconnu'
        }
    }

    if (!errorsTrace) return <Loader />

    return (
        <Container className="error-trace list">
            <h2>Liste des Erreurs</h2>
            <Row className="list-header">
                <Col xs={3} md={2}>Importance</Col>
                <Col xs={3}>Utilisateur</Col>
                <Col xs={3}>Date</Col>
                <Col xs={3}>Nom de la fonction</Col>
                <Col xs={2} md={1} className="text-end">
                    Action
                </Col>
            </Row>
            <Row className="list-body">
                <Col>
                    {errorsTrace.map((errorTrace) => (
                        <Row className="list-body-item" key={errorTrace._id}>
                            <Col xs={3} md={2}>{getLabelSeverity(errorTrace.severity)}</Col>
                            <Col xs={3}>
                                <span className="d-block d-md-none">
                                    {errorTrace.userId.lastname} {errorTrace.userId.firstname.charAt(0)}.
                                </span>
                                <span className="d-none d-md-block">
                                    {errorTrace.userId.lastname} {errorTrace.userId.firstname}
                                </span>
                            </Col>
                            <Col xs={3}>{dayjs(errorTrace.createdAt).format('DD/MM/YYYY à HH:mm')}</Col>
                            <Col xs={3}>{errorTrace.functionName}</Col>
                            <Col xs={2} md={1} className="text-end">
                                <PencilSquare cursor={'pointer'} onClick={() => handleEdit(errorTrace._id)} />
                            </Col>
                        </Row>
                    ))}
                </Col>
            </Row>
        </Container>
    )
}

export default ErrorTraceList
