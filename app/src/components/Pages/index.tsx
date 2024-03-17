import { Route, Routes, useLocation, useNavigate } from 'react-router'
import NotFound from '../utils/NotFound'
import Home from './Home'
// import Positions from './Positions'
import PlaceOrder from './PlaceOrder'
import { useAuth } from '../../hooks/AuthContext'
import CGU from '../CGU'
import { hasSubAccount, isTrader } from '../../utils'
import Payement from './Payment'
import AdminRouter from './Admin/admin.router'
import { generateRoutes } from './utils.functions'
import CryptobotRouter from './Cryptobot/cryptobot.router'
import { IRoute } from './pages.interface'
import { useEffect } from 'react'
import OrderBotRouter from './Admin/OrderBot/index.router'
import AppConfig from './Admin/AppConfig'
import Tutorial from '../Tutorial'
import Users from './Admin/Users'
import ErrorTraceRouter from './Admin/ErrorTrace/index.router'
import TelegramChannel from './Admin/TelegramChannel'
import SubAccountRouter from './SubAccounts/index.router'
import Preferences from './Preferences'
import Subscriptions from './Admin/Subscriptions'

export interface ICryptobotRouterProps {
    routes: IRoute[]
}

const Pages = () => {
    const { user } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    if (!user) return <div></div>

    const cryptobotRoutes: IRoute[] = [
        {
            path: 'register',
            Component: Home,
        },
        {
            path: 'login',
            Component: Home,
        },
        {
            path: 'conditions-generales-utilisation',
            Component: CGU,
        },
        {
            path: '/',
            Component: Home,
        },
        {
            path: 'home',
            Component: Home,
            title: 'Accueil',
        },
    ]

    if (!user.mainAccountId && user.subscription?.name) {
        cryptobotRoutes.push({
            path: 'payment',
            Component: Payement,
            title: 'Gérer mon abonnement',
        });
    }

    if (user.subscription?.name) {
        cryptobotRoutes.push({
            path: 'preferences',
            Component: Preferences,
            title: 'Préférences',
        });
    }

    if (isTrader(user)) {
        cryptobotRoutes.push({
            path: 'place-order',
            Component: PlaceOrder,
            disabled: !isTrader(user),
            title: 'Placer un ordre',
        })
    }

    if (hasSubAccount(user)) {
        cryptobotRoutes.push({
            path: 'sub-accounts/*',
            Component: SubAccountRouter,
            title: 'Sous-comptes',
        });
    }

    if (user.rights.includes('TELEGRAM_CHANNEL')) {
        cryptobotRoutes.push({
            path: 'telegram/channel',
            Component: TelegramChannel,
            title: 'Télégram',
        })
    }

    const adminRoutes: IRoute[] = [
        {
            Component: OrderBotRouter,
            path: 'order-bot/*',
            title: 'Ordres du bot',
        },
        {
            Component: AppConfig,
            path: 'app-config',
            title: 'Configuration du Bot télégram',
        },
        {
            Component: Users,
            path: 'users',
            title: 'Utilisateurs',
        },
        {
            Component: Subscriptions,
            path: 'subscriptions',
            title: 'Abonnements',
        },
        {
            title: 'Erreurs',
            path: 'error-trace/*',
            Component: ErrorTraceRouter,
        },
    ]

    const changeUserModeListener = (e: any) => {
        if (e.ctrlKey && e.shiftKey) {
            if (e.key === ' ') {
                navigate(location.pathname.includes('admin') ? 'home' : 'admin')
            }
        }
    }

    const changeUserMode = () => {
        navigate(!user.isAdmin || location.pathname.includes('admin') ? 'home' : 'admin')
    }

    useEffect(() => {
        user.isAdmin && window.addEventListener('keydown', changeUserModeListener)
        return () => {
            user.isAdmin && window.removeEventListener('keydown', changeUserModeListener)
        }
    }, [location, user.isAdmin])

    return (
        <>
            <Routes>
                <Route path={'/'} element={<CryptobotRouter onClickLogo={changeUserMode} routes={cryptobotRoutes} />} children={generateRoutes(cryptobotRoutes)} />
                {user.isAdmin && <Route path={'admin'} element={<AdminRouter onClickLogo={changeUserMode} routes={adminRoutes} />} children={generateRoutes(adminRoutes)} />}

                <Route path="/tutorial" element={<Tutorial />} />
                <Route path="conditions-generales-utilisation" element={<CGU />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    )
}

export default Pages
