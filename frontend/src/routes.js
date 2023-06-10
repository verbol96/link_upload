//import Print from "./pages/Print"
import Setting from "./pages/Setting"
import Statistic from "./pages/Statistic"
import Table from "./pages/Table"
import UsersDB from "./pages/UsersDB"
import Web from "./pages/Web"
import PrivatePage from "./pages/PrivatePage"
import Cloud from "./pages/Cloud"

export const privateRoutes = [
    {
        path: '/table',
        Component: Table
    },
    {
        path: '/usersDB',
        Component: UsersDB
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
]

export const routes = [
    {
        path: '/web',
        Component: Web
    }
]