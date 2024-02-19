import { Col, Container, Row } from 'react-bootstrap'
import './index.scss'
import TutorialSidebar from './Sidebar'
import TutorialStep from './TutorialStep'
import { useLayoutEffect, useState } from 'react'

const Tutorial = () => {
    const urlImage = '/tutorial'
    const [showSideBar, setShowSideBar] = useState<boolean>(false)

    useLayoutEffect(() => {
        setShowSideBar(true)
    }, [])
    return (
        <Container fluid className="tutorial">
            <TutorialSidebar show={showSideBar} />
            <Row className="tutorial-content">
                <Col xs={12} className="tutorial-step-group" id="inscription-bitget">
                    <h3>1 - Inscription sur bitget</h3>
                    <TutorialStep
                        step={'1.1'}
                        title="Rendez-vous sur la page d'inscription"
                        description={
                            <a href="https://www.bitget.com/fr/register?commonCode=WUEYSGWB" target="_blank">
                                Pour commencer, rendez-vous sur la page d'inscription en utilisant le lien de parrainage ou en mettant le code WUEYSGWB
                            </a>
                        }
                        image={`${urlImage}/bitget-inscription/1-page-inscription.png`}
                    />
                    <TutorialStep
                        step={'1.2'}
                        title="Rendez-vous dans les paramêtres"
                        description={
                            <>
                                Sécurisez votre compte en <b>activant au moins 2 étapes de sécurité dans vos paramètres</b>, telles que l'authentification à deux facteurs (2FA) et
                                l'authentification par e-mail. <br />
                                <br />
                                De plus, pour pouvoir effectuer des retraits de fonds en toute sécurité, <b>vous devrez vérifier votre identité</b>. Suivez les instructions dans
                                les paramètres de votre compte Bitget pour accomplir ces étapes essentielles.
                            </>
                        }
                        image={`${urlImage}/bitget-inscription/2-verification-identite.png`}
                    />
                </Col>
                <Col xs={12} className="tutorial-step-group" id="bitget-api">
                    <h3>2 - Création d'une clé API</h3>
                    <TutorialStep step={'2.1'} title="Rendez-vous sur la page des clés API" image={`${urlImage}/bitget-api/compte-principal/1-Aller-Dans-interface.png`} />
                    <TutorialStep step={'2.2'} title="Générez une clé API par le système" image={`${urlImage}/bitget-api/compte-principal/2-generer-cle.png`} />
                    <TutorialStep
                        step={'2.3'}
                        title="Configurez votre clé API"
                        description={
                            <>
                                <strong>Remplissez les différents champs proposés par l'interface: </strong>
                                <br />
                                Remarques : <i>Nom de la clé</i> <br />
                                Phrase secrète : <i>Mot de passe de la clé</i> <br />
                                Paramêtres d'autorisation : <i>Autorisations</i> <br />
                                Il faut au minimum:
                                <ol>
                                    <li>Futures: Afin de pouvoir poser et gérer les ordres</li>
                                </ol>
                                <p className='text-danger'>Surtout ne pas mettre l'accès au <b>Portefeuille</b>, de cette manière en cas de piratage de l'application, votre portefeuille restera en sécurité.</p>
                                <br />
                            </>
                        }
                        image={`${urlImage}/bitget-api/compte-principal/3-Donner-acces.png`}
                    />
                    <TutorialStep
                        step={'2.4'}
                        title="Retenez bien votre clé API"
                        description={
                            <>
                                <strong>Retenez bien votre clé API, la clé secrete fourni et votre phrase secrête </strong> car vous en aurez besoin par la suite <br />
                            </>
                        }
                        image={`${urlImage}/bitget-api/compte-principal/4-retenir-cle-API.png`}
                    />
                </Col>
                <Col xs={12} className="tutorial-step-group" id="bitget-depot">
                    <h3>3 - Déposer de l'argent sur votre compte futures</h3>
                    <TutorialStep
                        step={'3.1'}
                        title="Recommandation de dépôt"
                        image={`${urlImage}/bitget-depot/1-depot-argent.png`}
                        description={
                            <>
                                Peu importe la méthode que vous utilisez, il est important de retenir que vous devez:
                                <ol>
                                    <li>
                                        <strong>acheter des USDT</strong>
                                    </li>
                                    <li>
                                        <strong>déposer sur votre compte USDT-M account</strong> (=compte de futures). Si vous ne l'avez pas fait, vous devrez transférez vos fonds
                                        sur votre compte future
                                    </li>
                                    <li>
                                        faire un virement d'au minimum 500/600 USDT (seulement une recommandation).{' '}
                                        <strong>En dessous, de 300 USDT, le bot ne pourra pas fonctionner avec suffisament de marge</strong>
                                    </li>
                                </ol>
                            </>
                        }
                    />
                </Col>
                <Col xs={12} className="tutorial-step-group" id="cryptobot-inscription">
                    <h3>4 - Création d'un compte sur Cryptobot</h3>
                    <TutorialStep
                        step={'4.1'}
                        title="Créer un compte sur Cryptobot"
                        image={`${urlImage}/cryptobot-abonnement/1-inscription.png`}
                        description={
                            <>
                                Les informations à fournir ont été récupérees précédemment. <br />
                                Si un problème survient, n'hésitez pas à me contacter par email au <a href="mailto:tardyjim26@gmail.com">tardyjim26@gmail.com</a> en commençant
                                l'objet par <strong>[CRYPTOBOT-SUPPORT]</strong>
                            </>
                        }
                    />
                    <TutorialStep
                        step={'4.2'}
                        title="S'abonner à cryptobot"
                        image={`${urlImage}/cryptobot-abonnement/2-abonnement.png`}
                        description={
                            <>
                                Une fois votre compte créé, vous pouvez souscrire à l'abonnement de votre choix. <br />
                                <strong>Si vous avez un parrainage chez ulysse</strong>, abonnez-vous puis envoyez moi un mail à{' '}
                                <a href="mailto:tardyjim26@gmail.com">tardyjim26@gmail.com</a> en commençant l'objet par <strong>[CRYPTOBOT-ULYSSE]</strong> en mettant en pièces
                                jointes une capture d'écran de votre abonnement parrainé. J'appliquerai une réduction de 100% sur votre abonnement.
                            </>
                        }
                    />
                    <TutorialStep
                        step={'4.3'}
                        title="Configurer son bot"
                        image={`${urlImage}/cryptobot-abonnement/3-configuration.png`}
                        description={
                            <>
                                Si vous êtes débutant:
                                <ol>
                                    <li>Précisez la quantité d'USDT que vous voulez trader</li>
                                    <li>Précisez le % par ordre que vous souhaitez mettre</li>
                                </ol>
                                Si ces 2 champs ne sont pas remplis, cela utilisera le solde actuel disponible sur votre compte, et mettra 4% par trade. <br />
                                <strong>Il est fortement conseillé de mettre la même quantité initiale de quantité que vous avez sur votre compte futures</strong> <br />
                                <strong>Il est fortement déconseillé de dépasser 5% par ordre. Vous risquez de tout perdre si vous ne maîtriser pas le money management.</strong>
                                <br />
                                Si vous êtes un trader plus expérimenté, vous pouvez modifier la stratégie utilisée qui déplace la SL ou les tailles des TPs à prendre. <br />
                            </>
                        }
                    />
                </Col>
            </Row>
        </Container>
    )
}

export default Tutorial
