import { Outlet } from 'react-router'
import NavBarCryptobot from '../NavBar'
import { IPagesRouterProps } from '../pages.interface';

const CryptobotRouter = ({ routes }: IPagesRouterProps) => {
    return (
        <>
            <NavBarCryptobot routes={routes} />
            <Outlet />
        </>
    )
}

export default CryptobotRouter
