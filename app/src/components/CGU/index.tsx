import { Container } from 'react-bootstrap'
import ConditionGenerale from './ConditionGenerale'
import './index.scss';
export default function CGU() {
    return (
        <Container className='cgu'>
            <h2>
                Conditions générales d'utilisation pour l'utilisation du bot de
                Jimmy TARDY
            </h2>
            <p>Date de la dernière mise à jour : 03/11/2023</p>
            <p>
                Les présentes conditions générales d'utilisation (ci-après
                dénommées "CGU") régissent l'utilisation du bot de cryptomonnaie
                (ci-après dénommé le "Service") proposé par Jimmy TARDY (ci-après dénommé "Nous" ou "Notre"). En utilisant
                le Service, vous acceptez d'être lié par ces CGU. Si vous
                n'acceptez pas ces CGU, veuillez ne pas utiliser le Service.
            </p>
            <ul>
                <ConditionGenerale
                    title="Utilisation du Service"
                    parts={[
                        'Vous devez avoir au moins 18 ans pour utiliser le Service.',
                        "Vous êtes responsable de la sécurité de vos identifiants de connexion et de tout autre moyen d'authentification que nous pouvons fournir pour accéder au Service. Vous êtes également responsable de toutes les activités qui se produisent sous votre compte.",
                        "Vous acceptez de ne pas utiliser le Service à des fins illégales ou pour enfreindre les lois et réglementations en vigueur dans votre juridiction",
                    ]}
                    index={1}
                />
                <ConditionGenerale
                    title="Risques et responsabilités"
                    parts={[
                        "Vous reconnaissez que l'investissement dans les cryptomonnaies comporte des risques importants, y compris la perte totale de votre capital. Vous acceptez de prendre des décisions d'investissement en connaissance de cause et de ne pas tenir Nous responsables des pertes subies en utilisant le Service.",
                        "Nous ne fournissons pas de conseils financiers, fiscaux ou juridiques. Vous êtes responsable de consulter des professionnels qualifiés pour toute question financière, fiscale ou juridique liée à l'utilisation du Service.",
                    ]}
                    index={2}
                />
                <ConditionGenerale
                    title="Fonctionnement du Service"
                    parts={[
                        "Nous nous réservons le droit de modifier, de suspendre ou de mettre fin au Service à tout moment, avec ou sans préavis.",
                        "Nous ne garantissons pas la disponibilité continue du Service, et nous ne pouvons être tenus responsables des interruptions de service, des pannes techniques ou de tout autre problème pouvant survenir lors de l'utilisation du Service.",
                    ]}
                    index={1}
                />
                <ConditionGenerale
                    title="Confidentialité"
                    parts={[
                        "Nous collectons et utilisons vos informations seulement pour la bonne utilisation de notre application web.",
                    ]}
                    index={3}
                />
                <ConditionGenerale
                    title="Propriété intellectuelle"
                    parts={[
                        "Le Service, y compris tous les contenus, textes, images, logos et marques, est protégé par des droits de propriété intellectuelle détenus par Nous. Vous n'avez pas le droit de copier, reproduire, distribuer ou modifier le Service sans notre autorisation écrite préalable.",
                    ]}
                    index={4}
                />
                <ConditionGenerale
                    title="Résiliation"
                    parts={[
                        "Nous nous réservons le droit de résilier votre accès au Service à tout moment, avec ou sans motif, et sans préavis.",
                    ]}
                    index={5}
                />
                <ConditionGenerale
                    title="Contact"
                    parts={[
                        "Pour toute question ou préoccupation concernant ces CGU, veuillez nous contacter à l'adresse suivante : jimmy.tardy@jimmy-tardy-informatique.fr.",
                    ]}
                    index={6}
                />
            </ul>
        </Container>
    )
}
