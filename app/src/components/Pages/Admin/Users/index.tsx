import { useEffect, useState } from 'react'
import Loader from '../../../utils/Loader'
import axiosClient from '../../../../axiosClient'
import { Col, Container, Row } from 'react-bootstrap'
import { IUser } from '../../../../interfaces/user.interface'
import { PersonFillDown } from 'react-bootstrap-icons'
import { useAuth } from '../../../../hooks/AuthContext'
import './index.scss';
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

    if (isLoading) return <Loader />;

    const handleConnectIn = async (user: IUser) => {
        try {
            const response = await axiosClient.post('/auth/connect-in', { userId: user._id });
            setToken(response.data.access_token);
            navigate('/home', { replace: true });
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <Container className="users">
            <h2>Liste des utilisateurs</h2>
            <Row className="list-header">
                <Col xs={4} md={3} lg={2}>
                    Prénom NOM
                </Col>
                <Col xs={4} md={3} lg={2}>
                    Email
                </Col>
                <Col md={2}>
                    Abonnement
                </Col>
                <Col className="text-end">Actions</Col>
            </Row>
            {users.map((user) => {
                return (
                    <Row key={user._id} className="list-body">
                        <Col xs={4} md={3} lg={2}>
                            {user.firstname} {user.lastname}
                        </Col>
                        <Col xs={4} md={3} lg={2}>
                            {user.email}
                        </Col>
                        <Col xs={6}>
                            {!user.subscription?.active ? 'Aucun abonnement' : `[${user.subscription.name}]: ${user.subscription.active ? 'Actif' : 'Inactif'}`}
                        </Col>
                        <Col><PersonFillDown onClick={() =>  handleConnectIn(user)} /></Col>
                    </Row>
                )
            })}
        </Container>
    )
}

export default Users
