import { Route, Routes } from "react-router"
import NotFound from "../utils/NotFound"
import Home from "./Home";

const Pages = () => {
    return (
        <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/" element={<Home />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default Pages;