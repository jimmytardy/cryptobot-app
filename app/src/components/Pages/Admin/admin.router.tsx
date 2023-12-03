import { Outlet } from 'react-router'
import { Container } from 'react-bootstrap'
import NavBarCryptobot from '../NavBar'
import { IPagesRouterProps } from '../pages.interface'
import './index.scss'
const AdminRouter = ({ routes }: IPagesRouterProps) => {
    return (
        <>
            <NavBarCryptobot
                routes={routes}
                theme="dark"
                title="Admin Cryptobot"
            />
            <Container className="bg-dark text-white container-admin" fluid>
                <Outlet />
            </Container>
        </>
    )
}

export default AdminRouter
