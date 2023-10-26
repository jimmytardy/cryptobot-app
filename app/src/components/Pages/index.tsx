import { Route, Routes } from 'react-router'
import NotFound from '../utils/NotFound'
import Home from './Home'
import Preferences from './Preferences'
import NavBarCryptobot from './NavBar'
import Positions from './Home/Positions'

const Pages = () => {
    return (
        <>
            <NavBarCryptobot />
            <Routes>
                <Route path="/home" element={<Home />} />
                <Route path="/preferences" element={<Preferences />} />
                <Route path="/positions" element={<Positions />} />
                <Route path="/" element={<Home />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    )
}

export default Pages
