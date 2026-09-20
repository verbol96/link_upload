import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

const MENU_GROUPS = [
    {
        title: 'Работа',
        items: [
            { label: 'Заказы',   path: '/table',    icon: 'bi-receipt' },
            { label: 'Редактор', path: '/redactor', icon: 'bi-image' },
            { label: 'Файлы',    path: '/cloud',    icon: 'bi-folder2-open' },
        ],
    },
    {
        title: 'Другое',
        items: [
            { label: 'Клиенты',        path: '/users',     icon: 'bi-people' },
            { label: 'Статистика (root)',     path: '/statistic', icon: 'bi-bar-chart', adminOnly: true },
            { label: 'Бумага (root)',     path: '/material', icon: 'bi-card-list', adminOnly: true },
            { label: 'Личный кабинет', path: '/private',   icon: 'bi-person-badge' },
            { label: 'Форма заказа',   path: '/web',       icon: 'bi-cart' },
            { label: 'Настройки',      path: '/setting',   icon: 'bi-gear' },
            { label: 'Журнал расходов',      path: '/expenses',   icon: 'bi-cash-stack' },
        ],
    },
];

export const LeftMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const leftMenu = useSelector((state) => state.order.leftMenu);
    const user = useSelector((state) => state.private.user);

    const closeMenu = () => dispatch({ type: 'closeLeftMenu' });
    const goTo = (link) => { closeMenu(); navigate(link); };
    const isActive = (path) => location.pathname === path;

    const isAdmin = user?.phone === '+375333258247';

    const getShortName = (fio) => {
        if (!fio || typeof fio !== 'string') return 'Без имени';
        const parts = fio.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'Без имени';
        if (parts.length === 1) return parts[0];
        const [last, first, middle] = parts;
        const initials = [first?.[0], middle?.[0]].filter(Boolean).map(c => `${c}.`).join('');
        return `${last} ${initials}`;
    };

    return (
        <>
            {/* Оверлей */}
            {leftMenu && (
                <div
                    className="fixed inset-0 bg-slate-900/40 z-[998]"
                    onMouseDown={closeMenu}
                />
            )}

            {/* Панель */}
            <aside
                className={`fixed top-0 left-0 h-screen w-[260px] bg-white   border-cyan-950 shadow-[4px_0_24px_rgba(0,0,0,0.08)]
                        z-[999] flex flex-col transition-transform duration-300 ease-out
                        ${leftMenu ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Шапка */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-3.5 border-b border-gray-100  bg-teal-900">
                        <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg border border-neutral-500 text-neutral-500
                                        bg-white flex items-center justify-center font-bold text-[15px]">
                                L
                            </span>
                            <div className="leading-none">
                                <div className="text-xl font-light text-white">
                                    LINK
                                </div>
                                <div className="text-[10.5px] text-gray-400 mt-0.5">
                                    админ-панель
                                </div>
                            </div>
                        </div>
                        <button
                            className="w-[30px] h-[30px] rounded-md flex items-center justify-center
                                    text-gray-400 hover:bg-gray-100 hover:text-gray-900
                                    transition-colors text-sm"
                            onClick={closeMenu}
                            aria-label="Закрыть"
                        >
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>

                    {/* Меню с группами */}
                    <nav className="flex-1 overflow-y-auto px-2.5 py-3.5 flex flex-col gap-10">
                        {MENU_GROUPS.map((group) => {
                            const visibleItems = group.items.filter(
                                (item) => !item.adminOnly || isAdmin
                            );
                            if (!visibleItems.length) return null;

                            return (
                                <div key={group.title} className="flex flex-col gap-0.5">
                                    <div className="text-[10px] font-semibold tracking-wider uppercase
                                                text-gray-400 px-3 pb-1.5 select-none">
                                        {group.title}
                                    </div>

                                    {visibleItems.map((item) => {
                                        const active = isActive(item.path);
                                        return (
                                            <div
                                                key={item.path}
                                                onClick={() => goTo(item.path)}
                                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                                                        text-[13.5px] font-medium cursor-pointer
                                                        select-none transition-colors
                                                        ${active
                                                    ? 'bg-teal-900/60 text-white font-semibold'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                <i
                                                    className={`bi ${item.icon} w-[18px] text-center text-[15px]
                                                            shrink-0 transition-colors
                                                            ${active ? 'text-white' : 'text-gray-400'}`}
                                                />
                                                <span className="flex-1 truncate">
                                                    {item.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Подвал */}
                    <div className="flex items-center justify-between gap-2.5 px-4 py-2 border-t border-gray-100 bg-teal-900">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <i className="bi bi-person-circle text-[17px] text-white shrink-0" />
                            <div className="text-[12px] font-light text-white truncate min-w-0">
                                {getShortName(user?.FIO)}
                            </div>
                        </div>

                        <button
                            className="shrink-0 bg-teal-900 border border-gray-200 text-white
                                    text-[9px] font-semibold tracking-wide rounded-md
                                    px-2.5 py-1.5 transition-all
                                    hover:bg-teal-800 hover:text-white hover:border-white"
                            onClick={() => goTo('/history')}
                            title="История версий"
                        >
                            v 5.1
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};