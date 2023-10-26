import { Container, Nav, Navbar } from 'react-bootstrap'
import './index.scss'
import { useNavigate } from 'react-router'

const NavBarCryptobot = () => {
    const navigate = useNavigate();

    return (
        <Navbar expand="lg" className="navbar-cryptobot bg-body-tertiary">
            <Container>
                <Navbar.Brand onClick={() => navigate('home')}>
                    <img src={'icon.svg'} alt="Logo" />
                    Cryptobot
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link className='ml-3' onClick={() => navigate('home')}>Accueil</Nav.Link>
                        <Nav.Link className='ml-3' onClick={() => navigate('preferences')}>Préférences</Nav.Link>
                        <Nav.Link className='ml-3' onClick={() => navigate('positions')}>Positions</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default NavBarCryptobot
