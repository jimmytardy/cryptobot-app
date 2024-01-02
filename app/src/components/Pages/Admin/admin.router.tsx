import { Outlet } from 'react-router'
import { Container } from 'react-bootstrap'
import NavBarCryptobot from '../NavBar'
import { IPagesRouterProps } from '../pages.interface'
import './index.scss'
const AdminRouter = ({ routes }: IPagesRouterProps) => {
    return (
        <Container fluid className='bg-dark'>
            <NavBarCryptobot
                routes={routes}
                theme="dark"
            />
            <Container className="bg-dark text-white container-admin" fluid>
                <Outlet />
            </Container>
        </Container>
    )
}

export default AdminRouter
