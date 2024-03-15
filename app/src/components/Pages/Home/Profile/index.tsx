import { Col, Container, FormText, Row } from 'react-bootstrap'
import { useAuth } from '../../../../hooks/AuthContext'
import './index.scss'
import { useState } from 'react'
import { ClipboardCheckFill, ClipboardFill } from 'react-bootstrap-icons'

const Profile = () => {
    const { user } = useAuth()
    const [hasCopy, setHasCopy] = useState(false)
    const copyReferralLink = () => {
        const referralLink = `${window.location.origin}/register?referralcode=${user.referralCode}`
        navigator.clipboard.writeText(referralLink)
        setHasCopy(true)
    }

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
                <Col xs={12}>
                    <FormText>
                        {!user.mainAccountId ? 'Compte principal' : 'Sous-compte n°' + user.numAccount}
                    </FormText>
                </Col>
                {!user.mainAccountId && (
                    <Col xs={12}>
                        {user.subscription?.active && user.subscription?.status === 'active' ? (
                            <FormText onClick={copyReferralLink} className="referral-code">
                                Code de parrainage: <b>{user.referralCode}</b>{' '}
                                {!hasCopy ? (
                                    <ClipboardFill />
                                ) : (
                                    <>
                                        <ClipboardCheckFill />
                                        <i>Copié</i>
                                    </>
                                )}
                            </FormText>
                        ) : (
                            <FormText>Le parrainage sera disponible lorsque votre abonnement sera actif après la période d'essai</FormText>
                        )}
                    </Col>
                )}
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
                                {user.subscription.active ? 'Actif' : 'Inactif'} {user.subscription.status === 'trialing' && <i>- Essai gratuit</i>}
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
