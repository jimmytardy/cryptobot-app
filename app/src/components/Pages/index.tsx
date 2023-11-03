import { Route, Routes } from 'react-router'
import NotFound from '../utils/NotFound'
import Home from './Home'
import Preferences from './Preferences'
import NavBarCryptobot from './NavBar'
import Positions from './Home/Positions'
import PlaceOrder from './Home/PlaceOrder'
import { useAuth } from '../../hooks/AuthContext'
import { ReactNode } from 'react'
import CGU from '../CGU'
import { isTrader } from '../../utils'

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
            path: '/preferences',
            Component: Preferences,
            title: 'Préférences',
        },
        {
            path: '/place-order',
            Component: PlaceOrder,
            disabled: !isTrader(user),
            title: 'Placer un ordre',
        },
        {
            path: '/positions',
            Component: Positions,
            title: 'Positions',
        },
        {
            path: '/',
            Component: Home,
        },
    ]

    return (
        <>
            <NavBarCryptobot routes={routes} />
            <Routes>
                {routes
                    .filter((routes) => !routes.disabled)
                    .map((route) => (
                        <Route
                            key={'route-' + route.path}
                            path={route.path}
                            // @ts-ignore
                            element={<route.Component />}
                        />
                    ))}
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
