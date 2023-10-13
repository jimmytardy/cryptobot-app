import Login from './components/Login'
import { Route, Routes } from 'react-router-dom'
import NotFound from './components/NotFound'
import PlaceOrder from './components/PlaceOrder'
import SignUp from './components/SignUp'

function App() {
    const token = localStorage.getItem('token')

    if (!token) {
        return (
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<SignUp />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        )
    }
    return (
        <Routes>
            <Route path="/" element={<PlaceOrder />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default App
