import { useAuth } from './hooks/AuthContext'
import Auth from './components/Auth'
import Pages from './components/Pages'
import './App.scss';

function App() {
    const { isConnected, isLoading } = useAuth()

    if (isLoading) return <div></div>
    if (!isConnected) {
        return <Auth />
    }
    return <Pages />
}

export default App
