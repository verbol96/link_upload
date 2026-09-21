import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '../../ui/sheet';

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
            { label: 'Журнал расходов', path: '/expenses',   icon: 'bi-cash-stack' },
            { label: 'Клиенты',         path: '/users',      icon: 'bi-people' },
            { label: 'Статистика (root)', path: '/statistic', icon: 'bi-bar-chart', adminOnly: true },
            { label: 'Бумага (root)',    path: '/material',  icon: 'bi-card-list', adminOnly: true },
            { label: 'Личный кабинет',  path: '/private',   icon: 'bi-person-badge' },
            { label: 'Форма заказа',    path: '/web',       icon: 'bi-cart' },
            { label: 'Настройки',       path: '/setting',   icon: 'bi-gear' },
        ],
    },
];

export const LeftMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const leftMenu = useSelector((state) => state.order.leftMenu);
    const user = useSelector((state) => state.private.user);

    const closeMenu = useCallback(() => dispatch({ type: 'closeLeftMenu' }), [dispatch]);

    const goTo = (link) => {
        closeMenu();
        // небольшая задержка — чтобы анимация закрытия успела начаться
        setTimeout(() => navigate(link), 80);
    };

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
        <Sheet open={leftMenu} onOpenChange={(v) => { if (!v) closeMenu(); }}>
            <SheetContent
                side="left"
                className="w-[280px] max-w-[85vw] p-0 gap-0
                           flex flex-col
                           bg-white border-r border-gray-800
                           [&>button]:hidden"
            >
                {/* Хедер */}
                <SheetHeader className="flex-row items-center justify-between space-y-0
                                        px-4 pt-4 pb-3.5
                                        border-b border-teal-800 bg-teal-900 shrink-0">
                    <div className="flex items-center gap-2.5 text-left">
                        <span className="w-8 h-8 rounded-lg border border-neutral-500 text-neutral-500
                                        bg-white flex items-center justify-center font-bold text-[15px]">
                            L
                        </span>
                        <div className="leading-none">
                            <SheetTitle className="text-xl font-light text-white leading-none">
                                LINK
                            </SheetTitle>
                            <SheetDescription className="text-[10.5px] text-gray-400 mt-0.5">
                                админ-панель
                            </SheetDescription>
                        </div>
                    </div>

                    <button
                        className="w-9 h-9 rounded-md flex items-center justify-center
                                text-gray-300 hover:bg-white/10 hover:text-white
                                transition-colors text-sm"
                        onClick={closeMenu}
                        aria-label="Закрыть"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </SheetHeader>

                {/* Меню */}
                <nav
                    className="flex-1 overflow-y-auto overscroll-contain
                            px-2.5 py-3.5 flex flex-col gap-8"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
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
                                        <button
                                            type="button"
                                            key={item.path}
                                            onClick={() => goTo(item.path)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                                                    text-[13.5px] font-medium cursor-pointer
                                                    text-left select-none transition-colors
                                                    ${active
                                                        ? 'bg-teal-900/60 text-white font-semibold'
                                                        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
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
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                {/* Подвал */}
                <div className="flex items-center justify-between gap-2.5 px-4 py-3
                                border-t border-teal-800 bg-teal-900 shrink-0
                                pb-[max(env(safe-area-inset-bottom),12px)]">
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
            </SheetContent>
        </Sheet>
    );
};