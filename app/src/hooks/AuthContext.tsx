import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react'
import axiosClient from '../axiosClient'
import { useNavigate } from 'react-router'

// Créez le contexte d'authentification
const AuthContext = createContext({
    user: null as null | any,
    setToken: (t: string) => {return !!t;},
    isLoading: true,
})

// Créez un composant fournisseur qui gérera l'état d'authentification
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setStateToken] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const navigate = useNavigate()

    const forceLogout = () => {
        localStorage.removeItem('token')
        setStateToken(null)
        setUser(null);
        delete axiosClient.defaults.headers.common['Authorization']
        navigate('/login', { replace: true })
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
        <AuthContext.Provider value={{ user, setToken, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

// Créez un hook pour accéder au contexte d'authentification
export const useAuth = () => {
    return useContext(AuthContext)
}
