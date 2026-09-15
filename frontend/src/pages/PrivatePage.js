import { useState } from "react";
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Footer from "../components/admin/Footer";
import { NavBar } from "../components/admin/NavBar";
import { ChangeData } from "../components/privatePage/ChangeData";
import { MyOrdersUser } from "../components/privatePage/MyOrdersUser";
import { MyOrdersAdmin } from "../components/privatePage/MyOrdersAdmin";
import { MyFiles } from "../components/privatePage/MyFiles";

const PrivatePage = () => {
    const user = useSelector(state => state.private.user);
    const navigate = useNavigate();

    // Меню — зависит от роли
    const menu = user?.role === 'USER'
        ? [
            { label: 'Мои заказы', key: 'orders', icon: 'bi-bag' },
            { label: 'Профиль', key: 'profile', icon: 'bi-person' },
            { label: 'Файлы', key: 'files', icon: 'bi-folder' },
          ]
        : [
            { label: 'Заказы', key: 'orders', icon: 'bi-bag' },
            { label: 'Личные данные', key: 'profile', icon: 'bi-person' },
            { label: 'Мои файлы', key: 'files', icon: 'bi-folder' },
          ];

    const [activeKey, setActiveKey] = useState('orders');

    const ShowMenuItem = () => {
        switch (activeKey) {
            case 'orders':
                 return <MyOrdersUser user={user} />;
            case 'orders1': //убрад пока для админов в разработке
                if (user?.role === 'USER') return <MyOrdersUser user={user} />;
                return <MyOrdersAdmin />;
            case 'profile':
                return <ChangeData />;
            case 'files':
                return <MyFiles />;
            default:
                return <MyOrdersUser />;
        }
    };

        const ShowUser = () => {
            const fio = user?.FIO;
            if (!fio || typeof fio !== 'string') return 'Имя не указано';

            const parts = fio.trim().split(/\s+/).filter(Boolean);
            if (!parts.length) return 'Имя не указано';

            if (parts.length > 1) return `${parts[0]} ${parts[1]}`;
            return parts[0];
        };

    const getInitials = (fio) => {
        if (!fio || typeof fio !== 'string') return '?';
        const parts = fio.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        const first = parts[0]?.[0] ?? '';
        const second = parts[1]?.[0] ?? '';
        return (first + second).toUpperCase() || '?';
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <NavBar />

            <div className="flex-1 w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">

                {/* Заголовок + приветствие (только мобилка) */}
                <div className="md:hidden mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-teal-700 text-white flex items-center justify-center text-lg font-medium shrink-0">
                           {getInitials(user?.FIO)}
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Личный кабинет</div>
                            <div className="text-lg font-semibold text-gray-800">
                                {ShowUser()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Контейнер: на мобилке — колонка, на десктопе — 2 колонки */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">

                    {/* === МЕНЮ === */}
                    <aside className="md:w-64 shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">

                            {/* Заголовок меню (только десктоп) */}
                            <div className="hidden md:block p-4 border-b border-gray-100">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">
                                    Личный кабинет
                                </div>
                                <div className="text-lg font-semibold text-gray-800 mt-1">
                                    {ShowUser()}
                                </div>
                            </div>

                            {/* Пункты меню — на мобилке горизонтально */}
                            <nav className="md:hidden flex flex-row md:flex-col w-full overflow-hidden">
                                {menu.map((item) => {
                                    const isActive = activeKey === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => setActiveKey(item.key)}
                                            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start 
                                                    gap-1.5 md:gap-2
                                                    px-2 md:px-4 py-3 
                                                    text-xs md:text-sm font-medium 
                                                    transition-colors whitespace-nowrap
                                                    md:border-l-2 md:border-l-transparent
                                                    border-b-2 md:border-b-0
                                                    ${isActive
                                                        ? 'text-teal-900 md:bg-teal-50 md:border-l-teal-700 border-b-teal-700 bg-teal-900/5'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-b-transparent'
                                                    }`}
                                        >
                                            <i className={`bi ${item.icon} text-sm md:text-base text-teal-900`}></i>
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Пункты меню  на десктопе вертикально */}
                            <nav className="hidden md:flex flex-col ">
                                {menu.map((item) => {
                                    const isActive = activeKey === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => setActiveKey(item.key)}
                                            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start 
                                                    gap-1.5 md:gap-2
                                                    px-2 md:px-4 py-3 
                                                    text-xs md:text-sm font-medium 
                                                    transition-colors whitespace-nowrap
                                                    md:border-l-2 md:border-l-transparent
                                                    border-b-2 md:border-b-0
                                                    ${isActive
                                                        ? 'text-teal-900 md:bg-teal-800/10 md:border-l-teal-700 border-b-teal-700 bg-teal-900/5'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-b-transparent'
                                                    }`}
                                        >
                                            <i className={`bi ${item.icon} text-sm md:text-base text-teal-900`}></i>
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Кнопка "Новый заказ" — только для клиента */}
                        {user?.role === 'USER' && (
                            <button
                                onClick={() => navigate('/Web')}
                                className="hidden md:flex w-full mt-4 px-4 py-3 
                                        bg-white hover:bg-teal-900 
                                        text-teal-900 border-[1px] border-teal-900 rounded-xl text-sm font-medium 
                                        items-center justify-center gap-2 
                                        transition-colors shadow-sm"
                            >
                                <i className="bi bi-plus-lg text-teal-900"></i>
                                Новый заказ
                            </button>
                        )}
                    </aside>

                    {/* === КОНТЕНТ === */}
                    <main className="flex-1 min-w-0">
                        {ShowMenuItem()}
                    </main>

                    
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default PrivatePage;