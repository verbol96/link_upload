//import Print from "./pages/Print"
import Setting from "./pages/Setting"
import Statistic from "./pages/Statistic"
import Table from "./pages/Table"
import Editor from "./pages/Editor"
import Web from "./pages/Web"
import PrivatePage from "./pages/PrivatePage"
import Cloud from "./pages/Cloud"
import Users from "./pages/Users"
import Editor2 from "./pages/Editor2"

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
        path: '/editor2',
        Component: Editor2
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
        path: '/PrivatePage',
        Component: PrivatePage
    },
    {
        path: '/Cloud',
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
        path: '/PrivatePage',
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
    }
]