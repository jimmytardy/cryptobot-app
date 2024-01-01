import { Route, Routes } from "react-router"
import Login from "./Login"
import SignUp from "./SignUp"
import CGU from "../CGU"
import Tutorial from "../Tutorial"

const Auth = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="conditions-generales-utilisation" element={<CGU />} />
            <Route path="*" element={<Login />} />
        </Routes>
    )
}

export default Auth;