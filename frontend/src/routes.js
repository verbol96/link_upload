//import Print from "./pages/Print"
import Setting from "./pages/Setting"
import Statistic from "./pages/Statistic"
import Table from "./pages/Table"
import Web from "./pages/Web"
import PrivatePage from "./pages/PrivatePage"
import Cloud from "./pages/Cloud"
import Users from "./pages/Users"
import { Auth } from "./pages/Auth"
import Editor from "./pages/Editor"

export const adminRoutes = [
    {
        path: '/table',
        Component: Table
    },
    {
        path: '/editor',
        Component: Editor
    },
    {
        path: '/statistic',
        Component: Statistic
    },
    {
        path: '/setting',
        Component: Setting
    },
    {
        path: '/private',
        Component: PrivatePage
    },
    {
        path: '/cloud',
        Component: Cloud
    },
    {
        path: '/web',
        Component: Web
    },
    {
        path: '/users',
        Component: Users
    }
]

export const userRoutes = [

    {
        path: '/editor',
        Component: Editor
    },

    {
        path: '/private',
        Component: PrivatePage
    },

    {
        path: '/web',
        Component: Web
    },
]

export const publicRoutes = [
    {
        path: '/web',
        Component: Web
    },
    {
        path: '/auth',
        Component: Auth
    }
]