import { Route, Routes } from "react-router"
import Login from "./Login"
import SignUp from "./SignUp"

const Auth = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="*" element={<Login />} />
        </Routes>
    )
}

export default Auth;