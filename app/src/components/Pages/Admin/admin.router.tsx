import { Outlet } from 'react-router'
import { Container } from 'react-bootstrap'
import NavBarCryptobot from '../NavBar'
import { IPagesRouterProps } from '../pages.interface'
import './index.scss'
const AdminRouter = (props: IPagesRouterProps) => {
    return (
        <Container fluid className='bg-dark p-0'>
            <NavBarCryptobot
                {...props}
                theme="dark"
            />
            <Container className="bg-dark text-white container-admin" fluid>
                <Outlet />
            </Container>
        </Container>
    )
}

export default AdminRouter
