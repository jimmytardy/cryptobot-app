import { Route, Routes } from "react-router";
import SubAccountList from "./SubAccountList";
import SubAccounNew from "./SubAccounNew";

const SubAccountRouter = () => {
    return (
        <Routes>
            <Route path="" index element={<SubAccountList />} />
            <Route path="new" element={<SubAccounNew />} />
        </Routes>
    )
}

export default SubAccountRouter;