
import { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { setLogUser, setLogUserData, whoAmI } from '../http/authApi';
import { setUser } from '../store/privatePageReducer';
import { getOneUser } from '../http/dbApi';

import { COMPONENT_MAP } from './routes';
import {
    getRoutesForRole,
    getPublicRoutes,
    GUEST_PROTECTED_ROUTES,
} from './access';

const AppRouter = () => {
    const dispatch = useDispatch();
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant',
        });
    }, [location.pathname]);

    const isAuth = useSelector((state) => state.auth.auth);
    const reduxUser = useSelector((state) => state.private.user);

    const [userRole, setUserRole] = useState('');
    const [isUserDataLoaded, setUserDataLoaded] = useState(false);

    const initialPage = useRef(location.pathname);
    const visitLogged = useRef(false);
    const serverErrorShown = useRef(false);

    const showServerError = () => {
        if (serverErrorShown.current) return;

        serverErrorShown.current = true;

        window.alert(
            'Не удалось связаться с сервером. Попробуйте обновить страницу или открыть сайт в другом браузере. Если ошибка повторяется, напишите нам в Telegram или Instagram.'
        );
    };

    useEffect(() => {
        let cancelled = false;

        const loadUser = async () => {
            if (localStorage.getItem('token')) {
                try {
                    const user = await whoAmI();

                    if (cancelled) return;

                    setUserRole(user.role);
                    dispatch({ type: 'authStatus', paylods: true });

                    const data = await getOneUser(user.phone);

                    if (cancelled) return;

                    dispatch(setUser(data));
                    setLogUserData(data.user);
                } catch (err) {
                    if (cancelled) return;

                    console.error('Ошибка загрузки пользователя:', err);

                    setUserRole('');
                    setLogUserData(null);
                    showServerError();
                } finally {
                    if (!cancelled) {
                        setUserDataLoaded(true);
                    }
                }
            } else {
                if (cancelled) return;

                setUserRole('');
                setLogUserData(null);
                setUserDataLoaded(true);
            }
        };

        loadUser();

        return () => {
            cancelled = true;
        };
    }, [dispatch, isAuth]);

    useEffect(() => {
        if (!isUserDataLoaded || visitLogged.current) return;

        visitLogged.current = true;

        setLogUser({
            event: 'visit',
            eventType: 'info',
            page: initialPage.current,
        }).catch((error) => {
            console.error('setLogUser error:', error);
            showServerError();
        });
    }, [isUserDataLoaded]);

    useEffect(() => {
        if (!isUserDataLoaded || !visitLogged.current) return;

        if (location.pathname === initialPage.current) {
            initialPage.current = null;
            return;
        }

        setLogUser({
            event: 'page_view',
            eventType: 'info',
            page: location.pathname,
        }).catch((error) => {
            console.error('page_view log error:', error);
            showServerError();
        });
    }, [location.pathname, isUserDataLoaded]);

    // Redux позволяет получить роль сразу после входа,
    // не дожидаясь повторного запроса whoAmI.
    const effectiveRole = isAuth
        ? (reduxUser?.role || userRole)
        : '';

    const allowedPaths = useMemo(() => {
        if (!isAuth) {
            return getPublicRoutes();
        }

        if (!effectiveRole) {
            return getPublicRoutes();
        }

        return getRoutesForRole(effectiveRole);
    }, [isAuth, effectiveRole]);

    const fallbackPath = useMemo(() => {
        if (!isAuth) return '/web';

        if (
            effectiveRole === 'ADMIN' ||
            effectiveRole === 'WORKER'
        ) {
            return '/table';
        }

        return '/myOrders';
    }, [isAuth, effectiveRole]);

    if (!isUserDataLoaded) return null;

    // Не перенаправляем пользователя, пока после входа
    // ещё определяется его роль.
    if (isAuth && !effectiveRole) return null;

    return (
        <Routes>
            {allowedPaths.map((path) => {
                const Component = COMPONENT_MAP[path];

                if (!Component) return null;

                return (
                    <Route
                        key={path}
                        path={path}
                        element={<Component />}
                    />
                );
            })}

            {!isAuth &&
                GUEST_PROTECTED_ROUTES.map((path) => (
                    <Route
                        key={path}
                        path={path}
                        element={
                            <Navigate
                                to="/auth"
                                replace
                                state={{ from: path }}
                            />
                        }
                    />
                ))}

            <Route
                path="*"
                element={
                    <Navigate
                        to={fallbackPath}
                        replace
                    />
                }
            />
        </Routes>
    );
};

export default AppRouter;
