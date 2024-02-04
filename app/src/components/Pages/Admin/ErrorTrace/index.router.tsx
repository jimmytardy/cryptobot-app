import { Route, Routes } from "react-router";
import ErrorTraceList from "./ErrorTraceList";
import ErrorTraceEdit from "./ErrorTraceEdit";


const ErrorTraceRouter = () => {
    return (
        <Routes>
            <Route path="" index element={<ErrorTraceList />} />
            <Route path=":id" index element={<ErrorTraceEdit />} />
        </Routes>
    )
}

export default ErrorTraceRouter;