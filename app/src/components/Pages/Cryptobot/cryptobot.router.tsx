import { Outlet } from 'react-router'
import NavBarCryptobot from '../NavBar'
import { IPagesRouterProps } from '../pages.interface';

const CryptobotRouter = (props: IPagesRouterProps) => {
    return (
        <>
            <NavBarCryptobot {...props} />
            <Outlet />
        </>
    )
}

export default CryptobotRouter
