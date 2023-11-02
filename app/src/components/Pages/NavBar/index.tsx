import {
    Container,
    Nav,
    Navbar,
    OverlayTrigger,
    Tooltip,
} from 'react-bootstrap'
import './index.scss'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../../hooks/AuthContext'
import { IRoute } from '..'

interface NavBarCryptobotProps {
    routes: IRoute[]
}

const NavBarCryptobot: React.FC<NavBarCryptobotProps> = ({ routes }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout } = useAuth()

    return (
        <Navbar expand="lg" className="navbar-cryptobot bg-body-tertiary">
            <Container>
                <Navbar.Brand onClick={() => navigate('home')}>
                    <img src={'icon.svg'} alt="Logo" />
                    Cryptobot
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav>
                        {routes
                            .filter((route) => route.title)
                            .map((route) => (
                                <OverlayTrigger
                                    key={'nav-link-' + route.path}
                                    placement="bottom"
                                    overlay={
                                        <Tooltip>
                                            {route.disabled
                                                ? "Vous n'avez pas les droits necessaires"
                                                : route.title}
                                        </Tooltip>
                                    }
                                >
                                    <Nav.Link
                                        active={
                                            location.pathname === route.path
                                        }
                                        // disabled={route.disabled}
                                        className={
                                            'ms-3' +
                                            (route.disabled
                                                ? ' fw-light'
                                                : location.pathname === route.path ? ' fw-bold' :  ' fw-normal')
                                        }
                                        onClick={
                                            route.disabled
                                                ? undefined
                                                : () => navigate(route.path)
                                        }
                                    >
                                        {route.title}
                                    </Nav.Link>
                                </OverlayTrigger>
                            ))}
                        <Nav.Link className="ms-auto" onClick={logout}>
                            Se déconnecter
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default NavBarCryptobot
