import { Col, Container, FormText, Row } from 'react-bootstrap'
import { useAuth } from '../../../../hooks/AuthContext'
import './index.scss'

const Profile = () => {
    const { user } = useAuth()

    return (
        <Container className="profile">
            <Row>
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
            </Row>
            <Row>
                <Col xs={12}>
                    <div className="form-title">
                        <b>Abonnements</b>
                    </div>
                </Col>
                {user.subscription ? (
                    <Col xs={12}>
                        <FormText>
                            {user.subscription.name}:{' '}
                            <b>
                                {user.subscription.active ? 'Actif' : 'Inactif'}{' '}
                                {user.subscription.status === 'trialing' && (
                                    <i>- Essai gratuit</i>
                                )}
                            </b>
                        </FormText>
                    </Col>
                ) : (
                    <Col xs={12}>
                        <FormText>
                            <i>Aucun abonnement n'est souscrit</i>
                        </FormText>
                    </Col>
                )}
            </Row>
        </Container>
    )
}

export default Profile
