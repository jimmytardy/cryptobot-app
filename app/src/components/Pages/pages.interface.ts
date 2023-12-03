import { ReactNode } from "react";

export interface IPagesRouterProps {
    routes: IRoute[]
}

export interface IRoute {
    path: string
    Component?: React.FC | ReactNode
    title?: string
    disabled?: boolean;
}
