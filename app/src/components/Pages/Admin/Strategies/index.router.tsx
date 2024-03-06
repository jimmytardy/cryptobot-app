import { Route, Routes } from "react-router";
import StrategyList from "./StategyList";
import StategieEdit from "./StategieEdit";


const StategyRouter = () => {
    return (
        <Routes>
            <Route path="" index element={<StrategyList />} />
            <Route path=":id" element={<StategieEdit />} />
        </Routes>
    )
}

export default StategyRouter;