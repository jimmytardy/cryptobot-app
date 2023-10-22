import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react'
import axiosClient from '../axiosClient'
import { useNavigate } from 'react-router'

export interface IUser {
    firstname: string;
    lastname: string;
    email: string;
    orderConfig?: IUserConfig;
} 

export interface IUserConfig {
    quantity?: number
    pourcentage?: number
}
// Créez le contexte d'authentification
const AuthContext = createContext({
    user: {} as IUser,
    setToken: (t: string) => {return !!t as boolean;},
    setUserOrderConfig: (config: IUserConfig) => {return !!config as boolean;},
    isLoading: true,
    isConnected: false
})

// Créez un composant fournisseur qui gérera l'état d'authentification
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setStateToken] = useState<string | null>(null)
    const [user, setUser] = useState<IUser>({} as IUser);
    const [isConnected, setIsConnected] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const navigate = useNavigate()

    const forceLogout = () => {
        localStorage.removeItem('token')
        setStateToken(null)
        setUser({} as IUser);
        setIsConnected(false);
        delete axiosClient.defaults.headers.common['Authorization']
        navigate('/login', { replace: true })
    }

    const setUserOrderConfig = (config: IUserConfig) => {
        setUser({...user, orderConfig: config});
        return true;
    }

    const setToken = (t: string) => {
        setIsLoading(true);
        localStorage.setItem('token', t);
        axiosClient.defaults.headers.common[
            'Authorization'
        ] = `Bearer ${t}`;
        setStateToken(t);
        return true;
    }

    useEffect(() => {
        axiosClient.interceptors.response.use(
            (response) => {
                return response
            },
            async (error) => {
                if (error.response.status === 401) {
                    forceLogout()
                }
                return Promise.reject(error)
            },
        );
        const t = localStorage.getItem('token');
        if (t) {
            setToken(t);
        }
    }, []);

    // Simulez un appel asynchrone pour vérifier l'authentification
    useEffect(() => {
        ;(async () => {
            if (token) {
                const user = (await axiosClient.get('/auth/profile')).data?.user
                if (!user) {
                    forceLogout()
                } else {
                    setUser(user);
                    setIsConnected(true);
                    setStateToken(token);
                }
            }
            setIsLoading(false);
        })()
    }, [token])

    if (isLoading) {
        return <div>Chargement en cours...</div>
    }

    return (
        <AuthContext.Provider value={{ user, setUserOrderConfig, setToken, isLoading, isConnected }}>
            {children}
        </AuthContext.Provider>
    )
}

// Créez un hook pour accéder au contexte d'authentification
export const useAuth = () => {
    return useContext(AuthContext)
}
