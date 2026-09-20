import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../http/authApi';
import { LeftMenu } from './LeftMenu';
import { setUser } from '../../store/privatePageReducer';

export const NavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const user = useSelector(state => state.private.user);
    const isAuth = useSelector(state => state.auth.auth);

    const Logout = async () => {
        if (window.confirm("Вы уверены, что хотите выйти?")) {
            dispatch({ type: 'authStatus', paylods: false });
            dispatch(setUser({ user: {}, order: {} }));
            await logout();
            navigate('/web');
            localStorage.removeItem('token');
        }
    };

    // Стиль кнопок меню — точно как на скрине
    const labelClass = `
        cursor-pointer text-[15px] font-thin text-white/80
        border-[0.5px] border-white/20
        px-3 md:px-4 py-1
        rounded-md
        hover:bg-white/5
        whitespace-nowrap
    `;

    return (
        <div className="w-full bg-teal-900 text-white">
            <div className="px-2 ml-4 flex  h-14 md:flex items-center justify-between md:mx-12 md:h-14 md:px-6 ">

                <div className="flex items-center gap-4">
                    <LeftMenu />
                    <div
                        className="text-3xl font-thin text-white cursor-pointer select-none"
                        onClick={isAuth && user.role === 'ADMIN' ? () => dispatch({ type: 'showLeftMenu' }) : null}
                    >
                        LINK
                    </div>
                </div>

                {/* Правая часть: пункты меню */}
                <div className="flex items-center gap-3">
                    {isAuth ? (
                        <>
                            {location.pathname === '/private' ? (
                                <label className={labelClass} onClick={() => navigate('/web')}>
                                    Форма заказа
                                </label>
                            ) : (
                                <label className={labelClass} onClick={() => navigate('/private')}>
                                    Личный кабинет
                                </label>
                            )}

                            <label className={labelClass} onClick={Logout}>
                                Выйти
                            </label>
                        </>
                    ) : (
                        <>
                            {location.pathname === '/auth' ? (
                                <label className={labelClass} onClick={() => navigate('/web')}>
                                    Форма заказа
                                </label>
                            ) : (
                                <label className={labelClass} onClick={() => navigate('/auth')}>
                                    Личный кабинет
                                </label>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};