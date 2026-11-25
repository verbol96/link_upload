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

import {
    getMenuForRole,
    GUEST_PROTECTED_ROUTES,
} from '../../routes/access';

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
    const visibleGroups = getMenuForRole(userRole);

    const closeMenu = useCallback(
        () => dispatch({ type: 'closeLeftMenu' }),
        [dispatch]
    );

    const goTo = (link) => {
        closeMenu();

        setTimeout(() => {
            if (!isAuth && GUEST_PROTECTED_ROUTES.includes(link)) {
                navigate('/auth', { state: { from: link } });
            } else {
                navigate(link);
            }
        }, 80);
    };

    const isActive = (path) => {
        if (
            location.pathname === '/auth' &&
            !isAuth &&
            GUEST_PROTECTED_ROUTES.includes(location.state?.from)
        ) {
            return location.state.from === path;
        }
        return location.pathname === path;
    };

    const getShortName = (fio) => {
        if (!fio || typeof fio !== 'string') return 'Без имени';
        const parts = fio.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'Без имени';
        if (parts.length === 1) return parts[0];
        const [last, first] = parts;
        return `${last} ${first}`;
    };

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

    const menuItemClass = (active) =>
        `relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
         text-[12.5px] font-medium cursor-pointer text-left select-none
         transition-colors ${active
            ? 'bg-[#E8F0F8] text-[#274C77] font-semibold'
            : 'text-slate-700 hover:bg-[#274C77]/[0.07] active:bg-[#274C77]/10'
         }`;

    const menuIconClass = (active) =>
        `w-[18px] text-center text-[15px] shrink-0 transition-colors ${active
            ? 'text-[#274C77]'
            : 'text-slate-400'
         }`;

    return (
        <Sheet
            open={leftMenu}
            onOpenChange={(v) => { if (!v) closeMenu(); }}
        >
            <SheetContent
                side="left"
                className="w-[280px] max-w-[85vw] p-0 gap-0 flex flex-col
                           bg-slate-50   border-r-[1px] border-r-[#274C77]
                           [&>button]:hidden"
            >
                <SheetHeader
                    className="flex-row items-center justify-between
                               pl-8 py-2  bg-[#274C77]"
                >
                    <div className="flex flex-col items-start text-left">
                        <SheetTitle className="text-[22px] font-light text-white leading-none">
                            LINK
                        </SheetTitle>
                        <SheetDescription className="text-[12px] text-gray-300 mt-0.5">
                            сервис фотопечати
                        </SheetDescription>
                    </div>
                    <button
                        className="w-9 h-9 rounded-md flex items-center justify-center
                                   text-gray-300 hover:bg-white/10 hover:text-white
                                   focus:outline-none focus-visible:outline-none
                                   focus:ring-0 transition-colors text-sm"
                        onClick={closeMenu}
                        aria-label="Закрыть"
                        type="button"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </SheetHeader>

                {/* Все разделы, включая «Дополнительно», прокручиваются вместе */}
                <nav
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain
                               px-2.5 pt-16 pb-3.5 flex flex-col"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="flex flex-col gap-4">
                        {visibleGroups.map((group, gIdx) => (
                            <div
                                key={`${group.title}-${gIdx}`}
                                className="flex flex-col gap-0.5"
                            >
                                <div className="text-[10px] font-semibold tracking-wider
                                                uppercase text-slate-400 px-3 pb-2 select-none">
                                    {group.title}
                                </div>

                                {group.items.map((item) => {
                                    const active = isActive(item.path);
                                    return (
                                        <button
                                            type="button"
                                            key={`${item.path}-${item.label}`}
                                            onClick={() => goTo(item.path)}
                                            className={menuItemClass(active)}
                                        >
                                            {active && (
                                                <span className="absolute left-0 top-2 bottom-2
                                                                 w-[3px] rounded-full bg-[#274C77]" />
                                            )}
                                            <i className={`bi ${item.icon} ${menuIconClass(active)}`} />
                                            <span className="flex-1 truncate">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}

                        {/* Будущие «Каталог» и другие страницы добавлять сюда */}
                        <div className="flex flex-col gap-0.5">
                            <div className="text-[10px] font-semibold tracking-wider uppercase
                                            text-slate-400 px-3 pb-2 select-none">
                                Дополнительно
                            </div>
                            <button
                                type="button"
                                onClick={() => goTo('/contacts')}
                                className={menuItemClass(isActive('/contacts'))}
                            >
                                {isActive('/contacts') && (
                                    <span className="absolute left-0 top-2 bottom-2
                                                     w-[3px] rounded-full bg-[#274C77]" />
                                )}
                                <i className={`bi bi-shop ${menuIconClass(isActive('/contacts'))}`} />
                                <span className="flex-1 truncate">Контакты LINK</span>
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Профиль/вход закреплён снизу */}
                {isAuth ? (
                    <div className="bg-slate-200/70 rounded-xl m-2 shrink-0">
                        <div className="flex flex-row items-center justify-between gap-2.5 p-3">
                            <button
                                type="button"
                                onClick={() => goTo('/myProfile')}
                                className="flex items-center gap-2 min-w-0 flex-1 text-left"
                            >
                                <i className="bi bi-person-circle text-[15px] font-semibold text-slate-700 shrink-0" />
                                <div className="text-[12.5px] font-normal text-slate-700 truncate">
                                    {getShortName(user?.FIO)}
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="shrink-0 inline-flex items-end gap-2 rounded-md
                                           text-[12.5px] font-normal text-red-900"
                            >
                                <i className="bi bi-box-arrow-right text-[12px]" />
                                <span>Выйти</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-200/70 rounded-xl m-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => goTo('/auth')}
                            className="w-full flex items-center gap-2.5 p-3 rounded-lg
                                       text-[12.5px] font-medium text-slate-800
                                       hover:bg-slate-200 active:bg-slate-300 transition-colors"
                        >
                            <i className="bi bi-box-arrow-in-right w-[18px] text-center text-[15px]" />
                            <span>Войти</span>
                        </button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
