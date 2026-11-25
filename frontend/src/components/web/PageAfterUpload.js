import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../http/authApi';
import { getOneUser } from '../../http/dbApi';
import { setUser } from '../../store/privatePageReducer';
import { useEffect } from 'react';

export const PageAfterUpload = ({ amountPhoto, phone }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isAuth = useSelector(state => state.auth.auth);

    const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');

    useEffect(() => {
        if (isAuth) return;

        const login1 = async () => {
            try {
                const cleanPhone = removeNonNumeric(phone);
                const data = await login(cleanPhone);

                if (typeof data === 'object') {
                    dispatch({ type: 'authStatus', paylods: true });
                }
            } catch (error) {
                console.error('Ошибка автоматического входа после заказа:', error);
            }
        };

        login1();
    }, [dispatch, isAuth, phone]);

    const openOrder = async () => {
        try {
            const cleanPhone = removeNonNumeric(phone);
            const userData = await getOneUser(cleanPhone);
            dispatch(setUser(userData));
            navigate('/myOrders');
        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
            navigate('/myOrders');
        }
    };

    return (
        <div className="flex w-full flex-1 items-start justify-center px-3 pb-8 pt-7 md:items-center md:px-6 md:py-10">
            <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.3)]">
                <div className="px-5 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
                    <div className="relative mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center">
                        <div className="absolute inset-[9px] rounded-full border-[1px] border-teal-700 " />
                        <i className="bi bi-check-lg relative text-[30px] text-teal-700" aria-hidden="true" />
                    </div>

                    <h1 className="text-[21px] font-semibold tracking-tight text-black sm:text-[24px]">
                        Заказ отправлен!
                    </h1>
                    <p className="mx-auto mt-2 max-w-[330px] text-[13px] leading-6 text-slate-500 sm:text-sm">
                        Фотографии успешно переданы в LINK.
                        Спасибо, что выбрали нас!
                    </p>

                    <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-[12px] font-medium text-slate-600">
                        <i className="bi bi-images text-[14px] text-slate-400" aria-hidden="true" />
                        {amountPhoto === 1
                            ? 'Загружено 1 фото'
                            : `Загружено ${amountPhoto} фото`}
                    </div>
                </div>

                <div className="mx-5 border-t border-slate-100 sm:mx-8" />

                <div className="px-5 pb-6 pt-6 sm:px-8 sm:pb-8">
                    <div className="flex flex-row justify-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[0.5px] border-teal-700">
                            <i className="bi bi-bag-check text-[18px] text-teal-700" aria-hidden="true" />
                        </div>
                        <div className="">
                            <p className="text-[12px] text-slate-500">
                                Заказ доступен в личном кабинете. Там можно посмотреть детали и следить за статусом.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openOrder}
                        className="mt-6 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#274C77] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1E3A5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#274C77] focus-visible:ring-offset-2"
                    >
                        Посмотреть заказ
                        <i className="bi bi-arrow-right text-[15px]" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
};
