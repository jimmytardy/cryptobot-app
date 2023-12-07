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
import { IRoute } from '../pages.interface';

interface NavBarCryptobotProps {
    routes: IRoute[];
    theme?: string;
    title: string;
}

const NavBarCryptobot: React.FC<NavBarCryptobotProps> = ({ routes, theme, title }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout } = useAuth()

    return (
        <Navbar expand="lg" bg={theme} data-bs-theme={theme} className="navbar-cryptobot bg-body-tertiary">
            <Container>
                <Navbar.Brand onClick={() => navigate('home')}>
                    <img src={'/icon.svg'} alt="Logo" />
                    {title}
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="navbar-nav" />
                <Navbar.Collapse id='navbar-bar' className='navbar-body bg-body-tertiary p-3'>
                    <Nav>
                        {routes
                            .filter((route) => route.title)
                            .map((route) => {
                                const pathTo = route.path.slice(-1) == '*' ? route.path.slice(0, -2) : route.path;
                                return (
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
                                                location.pathname.includes(pathTo)
                                            }
                                            // disabled={route.disabled}
                                            className={
                                                'ms-3' +
                                                (route.disabled
                                                    ? ' fw-light'
                                                    : location.pathname.includes(pathTo) ? ' fw-bold' :  ' fw-normal')
                                            }
                                            onClick={
                                                route.disabled
                                                    ? undefined
                                                    : () => navigate(pathTo)
                                            }
                                        >
                                            {route.title}
                                        </Nav.Link>
                                    </OverlayTrigger>
                                )
                            })}
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
