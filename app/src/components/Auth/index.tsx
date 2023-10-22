import { Route, Routes } from "react-router"
import Login from "./Login"
import SignUp from "./SignUp"
import NotFound from "../utils/NotFound"

const Auth = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default Auth;