import { useEffect, useState } from 'react'
import Loader from '../../../utils/Loader'
import axiosClient from '../../../../axiosClient'
import { Col, Container, Row } from 'react-bootstrap'
import { IUser } from '../../../../interfaces/user.interface'
import { PersonFillDown } from 'react-bootstrap-icons'
import { useAuth } from '../../../../hooks/AuthContext'
import { useNavigate } from 'react-router'

const Users = () => {
    const { setToken } = useAuth()
    const [users, setUsers] = useState<IUser[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const navigate = useNavigate()
    useEffect(() => {
        const getUsers = async () => {
            const response = await axiosClient.get('/user/admin/users')
            setUsers(response.data)
            setIsLoading(false)
        }
        getUsers()
    }, [])

    if (isLoading) return <Loader />

    const handleConnectIn = async (user: IUser) => {
        try {
            const response = await axiosClient.post('/auth/connect-in', { userId: user._id })
            setToken(response.data.access_token)
            navigate('/home', { replace: true })
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <Container className="users list">
            <h2>Liste des utilisateurs</h2>
            <Row className="list-header">
                <Col xs={4} md={3}>
                    <span className="d-block d-md-none">Prénom N.</span>
                    <span className="d-none d-md-block">Prénom NOM</span>
                </Col>
                <Col className="d-none d-md-block" md={3}>
                    Email
                </Col>
                <Col xs={6} md={4}>
                    Abonnement
                </Col>
                <Col xs={2} className="d-none d-md-block text-end">
                    Actions
                </Col>
            </Row>
            <Row className="list-body">
                <Col>
                    {users.map((user) => {
                        return (
                            <Row key={user._id} className="list-body-item">
                                <Col xs={4} md={3} title={user.lastname + ' ' + user.firstname} className="text-truncate">
                                    <span className="d-block d-md-none">
                                        {user.lastname} {user.firstname.charAt(0)}.
                                    </span>
                                    <span className="d-none d-md-block">
                                        {user.lastname} {user.firstname}
                                    </span>
                                </Col>
                                <Col className="d-none d-md-block text-truncate" md={3}>
                                    {user.email}
                                </Col>
                                <Col xs={7} md={5} className="text-truncate">
                                    {!user.subscription?.name
                                        ? 'Aucun abonnement'
                                        : `[${user.subscription.name.replaceAll('Crypto', '')}]: ${user.subscription.active ? 'Actif' : 'Inactif'}`}
                                </Col>
                                <Col xs={1} className="list-body-actions">
                                    <PersonFillDown onClick={() => handleConnectIn(user)} />
                                </Col>
                            </Row>
                        )
                    })}
                </Col>
            </Row>
        </Container>
    )
}

export default Users
