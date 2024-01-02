import { Container, Nav, Navbar, OverlayTrigger, Tooltip } from 'react-bootstrap'
import './index.scss'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../../hooks/AuthContext'
import { IRoute } from '../pages.interface'
import { List } from 'react-bootstrap-icons'
import { useState } from 'react'

interface NavBarCryptobotProps {
    routes: IRoute[]
    theme?: string
}

const NavBarCryptobot: React.FC<NavBarCryptobotProps> = ({ routes, theme }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const [expanded, setExpanded] = useState<boolean>(false)
    const { logout } = useAuth()

    const handleNavigate = (path: string) => {
        navigate(path)
        setExpanded(false)
    }

    return (
        <Navbar expand="xl" bg={theme} data-bs-theme={theme} className="navbar-cryptobot" expanded={expanded}>
            <Container fluid>
                <Navbar.Brand onClick={() => navigate('home')}>
                    <img src={'/banner.png'} alt="Logo" />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="navbar-nav" onClick={() => setExpanded(true)}>
                    <List />
                </Navbar.Toggle>
                <Navbar.Collapse id="navbar-bar" className="navbar-body p-3">
                    <Nav>
                        {routes
                            .filter((route) => route.title)
                            .map((route) => {
                                const pathTo = route.path.slice(-1) == '*' ? route.path.slice(0, -2) : route.path
                                return (
                                    <OverlayTrigger
                                        key={'nav-link-' + route.path}
                                        placement="bottom"
                                        overlay={<Tooltip>{route.disabled ? "Vous n'avez pas les droits necessaires" : route.title}</Tooltip>}
                                    >
                                        <Nav.Link
                                            active={location.pathname.includes(pathTo)}
                                            // disabled={route.disabled}
                                            className={'ms-3' + (route.disabled ? ' fw-light' : location.pathname.includes(pathTo) ? ' fw-bold' : ' fw-normal')}
                                            onClick={route.disabled ? undefined : () => handleNavigate(pathTo)}
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
