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

import { getMenuForRole } from '../../routes/access';
import { logout } from '../../http/authApi';
import { setUser } from '../../store/privatePageReducer';

export const LeftMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const leftMenu = useSelector((state) => state.order.leftMenu);
    const user = useSelector((state) => state.private.user);

    const isAuth = !!user?.role;
    const userRole = user?.role || 'GUEST';
    const visibleGroups = isAuth ? getMenuForRole(userRole) : [];

    const closeMenu = useCallback(() => dispatch({ type: 'closeLeftMenu' }), [dispatch]);

    const goTo = (link) => {
        closeMenu();
        setTimeout(() => navigate(link), 80);
    };

    const isActive = (path) => location.pathname === path;

    const getShortName = (fio) => {
        if (!fio || typeof fio !== 'string') return 'Без имени';
        const parts = fio.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'Без имени';
        if (parts.length === 1) return parts[0];
        const [last, first, middle] = parts;
        const initials = [first?.[0], middle?.[0]].filter(Boolean).map(c => `${c}.`).join('');
        return `${last} ${initials}`;
    };

    // ============ ВЫХОД ============
    const handleLogout = async () => {
        if (!window.confirm('Вы уверены, что хотите выйти?')) return;

        closeMenu();
        dispatch({ type: 'authStatus', paylods: false });
        dispatch(setUser({ user: {}, order: {} }));
        await logout();
        localStorage.removeItem('token');
        sessionStorage.removeItem('logSessionId');
        sessionStorage.removeItem('logVisitCreated');
        sessionStorage.removeItem('logLastPage');
        sessionStorage.removeItem('logUserPhone');
        sessionStorage.removeItem('logUserSurname');
        navigate('/web');
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
                {/* ===== Шапка меню ===== */}
                <SheetHeader className="flex-row items-center justify-between space-y-0
                                        px-4 pt-4 pb-3.5
                                        border-b border-teal-800 bg-teal-800 shrink-0">
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
                                {isAuth ? 'меню' : 'гость'}
                            </SheetDescription>
                        </div>
                    </div>

                    <button
                        className="w-9 h-9 rounded-md flex items-center justify-center
                                text-gray-300 hover:bg-white/10 hover:text-white
                                focus:outline-none focus-visible:outline-none focus:ring-0
                                transition-colors text-sm"
                        onClick={closeMenu}
                        aria-label="Закрыть"
                        type="button"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </SheetHeader>

                {/* ===== Меню ===== */}
                <nav
                    className="flex-1 overflow-y-auto overscroll-contain
                            px-2.5 py-3.5 flex flex-col"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="my-auto flex flex-col gap-6">
                        {isAuth ? (
                            /* ===== АВТОРИЗОВАННЫЙ ===== */
                            visibleGroups.map((group, gIdx) => (
                                <div key={`${group.title}-${gIdx}`} className="flex flex-col gap-0.5">
                                    <div className="text-[10px] font-semibold tracking-wider uppercase
                                                text-gray-400 px-3 pb-2 select-none">
                                        {group.title}
                                    </div>

                                    {group.items.map((item) => {
                                        const active = isActive(item.path);

                                        return (
                                            <button
                                                type="button"
                                                key={`${item.path}-${item.label}`}
                                                onClick={() => goTo(item.path)}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                                                        text-[12.5px] font-medium cursor-pointer
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
                            ))
                        ) : (
                            /* ===== ГОСТЬ ===== */
                            <>
                                {/* Группа "Меню" — как у авторизованных */}
                                <div className="flex flex-col gap-0.5 mt-4">
                                    <div className="text-[10px] font-semibold tracking-wider uppercase
                                                text-gray-400 px-3 pb-1.5 select-none">
                                        Меню
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => goTo('/web')}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                                                text-[12.5px] font-medium cursor-pointer
                                                text-left select-none transition-colors
                                                ${isActive('/web')
                                                    ? 'bg-teal-900/60 text-white font-semibold'
                                                    : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                                                }`}
                                    >
                                        <i className={`bi bi-cart w-[18px] text-center text-[15px]
                                                    shrink-0 transition-colors
                                                    ${isActive('/web') ? 'text-white' : 'text-gray-400'}`}
                                        />

                                        <span className="flex-1 truncate">
                                            Оформить заказ
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => goTo('/auth')}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                                                text-[12.5px] font-medium cursor-pointer
                                                text-left select-none transition-colors
                                                ${isActive('/auth')
                                                    ? 'bg-teal-900/60 text-white font-semibold'
                                                    : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                                                }`}
                                    >
                                        <i className={`bi bi-person-badge w-[18px] text-center text-[15px]
                                                    shrink-0 transition-colors
                                                    ${isActive('/auth') ? 'text-white' : 'text-gray-400'}`}
                                        />

                                        <span className="flex-1 truncate">
                                            Личный кабинет
                                        </span>
                                    </button>
                                </div>

                                {/* Компактное уведомление о входе */}
                                <div className="flex flex-col gap-0.5 mt-5 border-[1px] border-gray-300/30 rounded-md p-3 px-4 mt-auto">
                                    <div>
                                        <div className="text-[12px] text-gray-500 leading-snug">
                                            Войдите, чтобы открыть личный кабинет и историю заказов.
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => goTo('/auth')}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                                                text-[12.5px] font-medium cursor-pointer
                                                text-left select-none transition-colors
                                                text-teal-800 hover:bg-teal-50 active:bg-teal-100"
                                    >
                                        <i className="bi bi-box-arrow-in-right w-[18px] text-center text-[15px]
                                                    shrink-0 text-teal-700" />

                                        <span className="flex-1 truncate">
                                            Войти
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </nav>

                {/* ===== Подвал ===== */}
                {isAuth ?
                    <div className="border-t border-teal-800 bg-white shrink-0
                                    pb-[max(env(safe-area-inset-bottom),12px)]">

                        <div className="flex items-center justify-between gap-2.5 px-4 py-2">

                            {/* Левая часть: аватар + имя */}
                            <button
                                type="button"
                                onClick={() => goTo('/myProfile')}
                                className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                            >
                                <i className="bi bi-person-circle text-[20px] text-gray-600 shrink-0" />

                                <div className="text-[12.5px] font-light text-gray-600 truncate">
                                    {getShortName(user?.FIO)}
                                </div>
                            </button>

                            {/* Правая часть: кнопка «Выйти» */}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="shrink-0 inline-flex items-center gap-1.5 px-3 rounded-md
                                        text-[11.5px] font-light
                                        text-gray-600 border-[0.3px] border-white "
                            >
                                <i className="bi bi-box-arrow-right text-[12px]" />
                                <span>Выйти</span>
                            </button>
                        </div>
                    </div>
                    :
                    <div className="border-t border-teal-800 bg-white shrink-0
                                    pb-[max(env(safe-area-inset-bottom),12px)]">
                        <div className="flex items-center justify-between gap-2.5 px-4 py-3"></div>
                    </div>
                }
            </SheetContent>
        </Sheet>
    );
};