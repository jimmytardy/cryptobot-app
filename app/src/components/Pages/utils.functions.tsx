import { Route } from "react-router";
import { IRoute } from ".";
import { ReactNode } from "react";

export const generateRoutes = (routes: IRoute[]): ReactNode => {
    return routes
        .filter((routes) => !routes.disabled)
        .map((route) => (
            <Route
                key={'route-' + route.path}
                path={route.path}
                // @ts-ignore
                element={<route.Component />}
            />
        ))
}