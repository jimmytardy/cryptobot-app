import { Route, Routes, useLocation, useNavigate } from 'react-router'
import NotFound from '../utils/NotFound'
import Home from './Home'
import Preferences from './Preferences'
import Positions from './Positions'
import PlaceOrder from './PlaceOrder'
import { useAuth } from '../../hooks/AuthContext'
import CGU from '../CGU'
import { isTrader } from '../../utils'
import Payement from './Payment'
import AdminRouter from './Admin/admin.router'
import { generateRoutes } from './utils.functions'
import CryptobotRouter from './Cryptobot/cryptobot.router'
import { IRoute } from './pages.interface'
import { useEffect } from 'react'
import OrderBotRouter from './Admin/OrderBot/index.router'
import AppConfig from './Admin/AppConfig'

export interface ICryptobotRouterProps {
    routes: IRoute[]
}

const Pages = () => {
    const { user } = useAuth();
    const location = useLocation()
    const navigate = useNavigate()
    if (!user) return <div></div>

    const cryptobotRoutes: IRoute[] = [
        {
            path: 'home',
            Component: Home,
            title: 'Accueil',
        },
        {
            path: 'place-order',
            Component: PlaceOrder,
            disabled: !isTrader(user),
            title: 'Placer un ordre',
        },
        {
            path: 'preferences',
            Component: Preferences,
            title: 'Préférences',
        },
        {
            path: 'positions',
            Component: Positions,
            title: 'Positions',
        },
        {
            path: 'payment',
            Component: Payement,
            title: 'Gérer mon abonnement',
        },
        {
            path: '/',
            Component: Home,
        },
    ]

    const adminRoutes: IRoute[] = [
        {
            Component: OrderBotRouter,
            path: 'order-bot/*',
            title: 'Ordres du bot',
        },
        {
            Component: AppConfig,
            path: 'app-config',
            title: 'Configuration du serveur',
        },
    ];

    const changeUserMode = (e: any) => {
        if (e.ctrlKey && e.shiftKey) {
            if (e.key === ' ') {
                navigate(location.pathname.includes('admin') ? 'home' : 'admin');
            }
        }
    }

    useEffect(() => {
        user.isAdmin && window.addEventListener('keydown', changeUserMode);
        return () => {
            user.isAdmin && window.removeEventListener('keydown', changeUserMode);
        }
    }, [location, user.isAdmin]);

    return (
        <>
            <Routes>
                <Route
                    path={'/'}
                    element={<CryptobotRouter routes={cryptobotRoutes} />}
                    children={generateRoutes(cryptobotRoutes)}
                />

                <Route
                    path={'admin'}
                    element={<AdminRouter routes={adminRoutes}/>}
                    children={generateRoutes(adminRoutes)}
                />
                <Route
                    path="conditions-generales-utilisation"
                    element={<CGU />}
                />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    )
}

export default Pages;
