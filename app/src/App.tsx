import { useAuth } from './hooks/AuthContext'
import Auth from './components/Auth'
import Pages from './components/Pages'
import './App.scss';
import './scss/list.scss'
function App() {
    const { isConnected } = useAuth()
    if (!isConnected) {
        return <Auth />
    }
    return <Pages />
}

export default App
