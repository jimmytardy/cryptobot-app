import { useAuth } from './hooks/AuthContext'
import Auth from './components/Auth'
import Pages from './components/Pages'
import './App.scss';
import Loader from './components/utils/Loader';

function App() {
    const { isConnected } = useAuth()
    if (!isConnected) {
        return <Auth />
    }
    return <Pages />
}

export default App
