import {
    Button,
    Col,
    Container,
    FormGroup,
    FormLabel,
    Row,
} from 'react-bootstrap'
import * as React from 'react'

import { useAuth } from '../../../hooks/AuthContext'
import axiosClient from '../../../axiosClient'
import {
    IUserSubscriptionItem,
    UserSubscriptionEnum,
} from '../../../interfaces/user.interface'

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'stripe-pricing-table': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            >
        }
    }
}

const Payement = () => {
    const { user } = useAuth()
    const handleRedirectAccount = async () => {
        const result = await axiosClient.post(
            '/payment/stripe/create-customer-portal-session',
        )
        window.location.href = result.data.url
    }

    const getSubscriptionDescription = (
        subscription: IUserSubscriptionItem,
    ) => {
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
                    {Object.values(UserSubscriptionEnum)
                        .filter((value) => user.subscription[value])
                        .map((value: UserSubscriptionEnum, index) => {
                            const stateSubscription = user.subscription[value]
                            return (
                                <FormGroup key={index}>
                                    <FormLabel>
                                        <b>[{stateSubscription.name}]: </b>
                                        {stateSubscription.active
                                            ? 'Actif'
                                            : 'Inactif'}{' '}
                                        {stateSubscription.status ===
                                            'trialing' && (
                                            <i>- Essai gratuit</i>
                                        )}
                                    </FormLabel>
                                    <p>{getSubscriptionDescription(stateSubscription)}</p>
                                </FormGroup>
                            )
                        })}
                </Col>
            </Row>
            {Object.values(user.subscription).length === 0 ? (
                <Row>
                    <stripe-pricing-table
                        pricing-table-id="prctbl_1O8pWBC7rML7LYwFbUSsH3lb"
                        publishable-key={import.meta.env.VITE_STRIPE_KEY}
                        customer-email={user.email}
                    ></stripe-pricing-table>
                </Row>
            ) : (
                <Row>
                    <Col xs={6} md={2}>
                        <Button onClick={handleRedirectAccount}>
                            Gérer mon abonnement
                        </Button>
                    </Col>
                </Row>
            )}
        </Container>
    )
}

export default Payement
