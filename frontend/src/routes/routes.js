import Setting from "../pages/Setting"
import Statistic from "../pages/Statistic"
import Table from "../pages/Table"
import Web from "../pages/Web"
import Cloud from "../pages/Cloud"
import Users from "../pages/Users"
import { Auth } from "../pages/Auth"
import History from "../pages/History"
import RedactorPhoto from "../pages/RedactorPhoto"
import Expenses from "../pages/Expenses"
import MyFiles from "../pages/MyFiles"
import Tools from "../pages/Tools"
import MyOrders from "../pages/MyOrders"
import MyProfile from "../pages/MyProfile"

// ============================================================
// Маппинг: путь → компонент.
// Используется в AppRouter для построения маршрутов.
// Права доступа (кто какие пути видит) — в src/lib/access.js
// ============================================================
export const COMPONENT_MAP = {
    '/table':     Table,
    '/redactor':  RedactorPhoto,
    '/users':     Users,
    '/cloud':     Cloud,
    '/myOrders':   MyOrders,
    '/myProfile':   MyProfile,
    '/myFiles':   MyFiles,
    '/web':       Web,
    '/expenses':  Expenses,
    '/statistic': Statistic,
    '/setting':   Setting,
    '/history':   History,
    '/auth':      Auth,
    '/tools':  Tools,
    
};