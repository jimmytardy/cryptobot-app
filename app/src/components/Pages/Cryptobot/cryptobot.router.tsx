import { Outlet } from 'react-router'
import NavBarCryptobot from '../NavBar'
import { IPagesRouterProps } from '../pages.interface';

const CryptobotRouter = ({ routes }: IPagesRouterProps) => {
    return (
        <>
            <NavBarCryptobot title="Cryptobot" routes={routes} />
            <Outlet />
        </>
    )
}

export default CryptobotRouter
