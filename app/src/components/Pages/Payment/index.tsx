import { Button, Col, Container, FormGroup, FormLabel, Row } from 'react-bootstrap'
import { DetailedHTMLProps, HTMLAttributes } from 'react'

import { useAuth } from '../../../hooks/AuthContext'
import axiosClient from '../../../axiosClient'
import { IUserSubscriptionItem } from '../../../interfaces/user.interface'

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'stripe-pricing-table': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
        }
    }
}

const Payement = () => {
    const { user } = useAuth();

    const pricingTableId = import.meta.env.VITE_STRIPE_PRICING_TABLE;

    const handleRedirectAccount = async () => {
        const result = await axiosClient.post('/payment/stripe/create-customer-portal-session')
        window.location.href = result.data.url
    }

    const getSubscriptionDescription = (subscription: IUserSubscriptionItem) => {
        switch (subscription.status) {
            case 'trialing':
                return "L'abonnement en cours de période d'essai."
            case 'active':
                return "L'abonnement est en cours."
            case 'incomplete':
                return "Un paiement réussi doit être effectué dans les 23 heures pour activer l'abonnement."
            case 'past_due':
                return "Le paiement de la dernière facture finalisée a échoué ou n’a pas été tenté. L'abonnement est en cours d'arret."
            case 'canceled':
                return "L'abonnement est annulé."
            case 'unpaid':
                return "Le paiement de la dernière facture finalisée a échoué ou n’a pas été tenté. L'abonnement est en cours d'arret."
            case 'paused':
                return 'L’abonnement est arrivé au terme de sa période d’essai sans avoir configuré de moyen de paiement par défaut.'
        }
    }

    return (
        <Container>
            <h2>Paiement</h2>
            <Row>
                <Col xs={6}>
                    {user.subscription && (
                        <FormGroup>
                            <FormLabel>
                                <b>[{user.subscription?.name || 'Abonnement'}]: </b>
                                {user.subscription.active ? 'Actif' : 'Inactif'} {user.subscription.status === 'trialing' && <i>- Essai gratuit</i>}
                            </FormLabel>
                            <p>{getSubscriptionDescription(user.subscription)}</p>
                        </FormGroup>
                    )}
                </Col>
            </Row>
            {!user.subscription || Object.keys(user.subscription).length === 0 ? (
                <Row>
                    <stripe-pricing-table
                        pricing-table-id={pricingTableId}
                        publishable-key={import.meta.env.VITE_STRIPE_KEY}
                        customer-email={user.mainAccountId?.email || user.email}
                    ></stripe-pricing-table>
                </Row>
            ) : (
                <Row>
                    <Col xs={6} md={2}>
                        <Button style={{ whiteSpace: 'nowrap' }} onClick={handleRedirectAccount}>
                            Gérer mon abonnement
                        </Button>
                    </Col>
                </Row>
            )}
        </Container>
    )
}

export default Payement
