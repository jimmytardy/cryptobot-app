import { Route, Routes } from 'react-router'
import NotFound from '../utils/NotFound'
import Home from './Home'
import Preferences from './Preferences'
import NavBarCryptobot from './NavBar'
import Positions from './Positions'
import PlaceOrder from './PlaceOrder'
import { useAuth } from '../../hooks/AuthContext'
import { ReactNode } from 'react'
import CGU from '../CGU'
import { isTrader } from '../../utils'
import Payement from './Payment'
import Admin from './Admin'
import { generateRoutes } from './utils.functions'
import NavBarAdmin from './Admin/NavBarAdmin'
import OrderBot from './Admin/OrderBot'
import OrderBotEdit from './Admin/OrderBot/OrderBotEdit'

export interface IRoute {
    path: string
    Component: React.FC | ReactNode
    title?: string
    disabled?: boolean
}

const Pages = () => {
    const { user } = useAuth()
    if (!user) return <div></div>
    const routes: IRoute[] = [
        {
            path: '/home',
            Component: Home,
            title: 'Accueil',
        },
        {
            path: '/place-order',
            Component: PlaceOrder,
            disabled: !isTrader(user),
            title: 'Placer un ordre',
        },
        {
            path: '/preferences',
            Component: Preferences,
            title: 'Préférences',
        },
        {
            path: '/positions',
            Component: Positions,
            title: 'Positions',
        },
        {
            path: '/payment',
            Component: Payement,
            title: "Gérer mon abonnement"
        },
        {
            path: '/',
            Component: Home,
        },
    ];

    const routesAdmin: IRoute[] = [
        {
            Component: OrderBot,
            path: '/admin/order-bot',
            title: 'Ordres du bot',
        },
        {
            Component: OrderBotEdit,
            path: '/admin/order-bot/:id',
        },
    ]

    return (
        <>
            {user.isAdmin && <NavBarCryptobot title='Panneau Administrateur' routes={routesAdmin} theme='dark' />}
            <NavBarCryptobot title='Cryptobot' routes={routes} />
            <Routes>
                {generateRoutes(routes)}
                {user.isAdmin && generateRoutes(routesAdmin)}
                <Route
                    path="conditions-generales-utilisation"
                    element={<CGU />}
                />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    )
}

export default Pages
