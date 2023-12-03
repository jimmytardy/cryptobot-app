import { Route } from "react-router";
import { ReactNode } from "react";
import { IRoute } from "./pages.interface";

export const generateRoutes = (routes: IRoute[]): ReactNode => {
    return routes
        .filter((route) => !route.disabled && route.Component)
        .map((route) => (
            <Route
                key={'route-' + route.path}
                path={route.path}
                // @ts-ignore
                element={<route.Component />}
            />
        ))
}