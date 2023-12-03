import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useLayoutEffect,
} from 'react'
import axiosClient from '../axiosClient'
import { useNavigate } from 'react-router'
import { IUser } from '../interfaces/user.interface';
import Loader from '../components/utils/Loader';

// Créez le contexte d'authentification
const AuthContext = createContext({
    user: {} as IUser,
    setToken: (t: string) => {return !!t as boolean;},
    logout: () => {return;},
    isConnected: false
})

// Créez un composant fournisseur qui gérera l'état d'authentification
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setStateToken] = useState<string | null>(null)
    const [user, setUser] = useState<IUser>({} as IUser);
    const [isConnected, setIsConnected] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [tokenLoading, setTokenLoading] = useState<boolean>(true);

    const navigate = useNavigate()

    const forceLogout = () => {
        localStorage.removeItem('token')
        setStateToken(null)
        setUser({} as IUser);
        setIsConnected(false);
        setIsLoading(false);
        setTokenLoading(false);
        delete axiosClient.defaults.headers.common['Authorization']
        navigate('/login', { replace: true })
    }

    const setToken = (t: string) => {
        setTokenLoading(true);
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
    useLayoutEffect(() => {
        ;(async () => {
            if (token) {
                const user = (await axiosClient.get('/user/profile')).data
                if (!user) {
                    forceLogout()
                } else {
                    setUser(user);
                    setStateToken(token);
                    setIsConnected(true);
                }
            }
            setTokenLoading(false)
            
        })().then(() => setIsLoading(false));

    }, [token]);

    if (tokenLoading || isLoading) {
        return <Loader />
    }
    
    return (
        <AuthContext.Provider value={{ user, setToken, isConnected, logout: forceLogout }}>
            {children}
        </AuthContext.Provider>
    )
}

// Créez un hook pour accéder au contexte d'authentification
export const useAuth = () => {
    return useContext(AuthContext)
}
