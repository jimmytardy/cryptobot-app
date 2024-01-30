import { Route, Routes } from "react-router";
import OrderBotEdit from "./OrderBotEdit";
import OrderBotList from "./OrderBotList";
import OrderBotNew from "./OrderBotNew";


const OrderBotRouter = () => {
    return (
        <Routes>
            <Route path="" index element={<OrderBotList />} />
            <Route path="new" element={<OrderBotNew />} />
            <Route path=":id" element={<OrderBotEdit />} />
        </Routes>
    )
}

export default OrderBotRouter;