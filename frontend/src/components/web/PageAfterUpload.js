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
        <div className="flex-1 w-full flex items-center justify-center mt-8 px-1 py-6 md:px-6 md:py-6">
            <div className="w-full max-w-[560px] md:max-w-[720px] bg-white rounded-2xl
                            border border-stone-200
                            shadow-[0_8px_30px_-12px_rgba(44,53,49,0.18)]
                            px-4 py-7 md:px-10 md:py-10">

                {/* ===== Успешно ===== */}
                <div className="flex items-center justify-center gap-3 md:gap-5">
                    <div className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#19766d]/10
                                    flex items-center justify-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#19766d]
                                        flex items-center justify-center
                                        shadow-[0_5px_18px_-4px_rgba(25,118,109,0.35)]">
                            <i className="bi bi-check-lg text-white text-[19px] md:text-[22px]" />
                        </div>
                    </div>

                    <div className="flex flex-col items-start">
                        <h4 className="text-[17px] md:text-[23px] font-normal text-stone-700 leading-[1.2]">
                            Успешно отправлено!
                        </h4>

                        <div className="mt-1.5 inline-flex items-center gap-1.5
                                        bg-[#19766d]/5 text-stone-700
                                        px-2.5 py-1 rounded-full
                                        text-[11.5px] md:text-[13px] font-medium">
                            <i className="bi bi-check-circle-fill text-[11px] md:text-[12px]" />
                            {amountPhoto === 1
                                ? 'Загружено 1 фото'
                                : `Загружено ${amountPhoto} фото`
                            }
                        </div>
                    </div>
                </div>

                {/* ===== Личный кабинет ===== */}
                <div className="mt-10 md:mt-8 pt-4 md:pt-7 border-t border-dashed border-stone-200">
                    <div className="flex items-center gap-3 md:gap-4 rounded-xl bg-slate-50
                                    px-3.5 py-3 md:px-5 md:py-4">
                        <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#19766d]/10
                                        flex items-center justify-center">
                            <i className="bi bi-person text-stone-700 text-[20px] md:text-[23px]" />
                        </div>

                        <div className="min-w-0">
                            <div className="text-[13.5px] md:text-[16px] font-semibold text-stone-700 leading-snug">
                                Заказ уже в личном кабинете
                            </div>
                            <div className="mt-0.5 text-[11.5px] md:text-[13px] text-stone-400 leading-snug">
                                Там можно проверить его статус и детали
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openOrder}
                        className="mt-3 md:mt-4 w-full h-11 md:h-12 rounded-xl 
                                bg-teal-600 hover:bg-teal-700
                                text-white text-[13.5px] md:text-[15px] font-medium
                                flex items-center justify-center gap-2.5
                                shadow-[0_5px_14px_-7px_rgba(25,118,109,0.6)]
                                transition-colors"
                    >
                        <i className="bi bi-bag text-[14px] md:text-[16px]" />
                        Посмотреть заказ
                        <i className="bi bi-arrow-right text-[13px] md:text-[15px] ml-1" />
                    </button>
                </div>

                {/* ===== Соцсети ===== */}
                <div className="mt-5 md:mt-7 pt-4 md:pt-6 border-t border-dashed border-stone-200">
                    <div className="text-center text-[11px] md:text-[12.5px] text-stone-400">
                        Есть вопрос по заказу?
                    </div>

                    <div className="mt-3 md:mt-4 grid grid-cols-2 gap-2.5 md:gap-4">
                        <a
                            href="https://www.instagram.com/link.belarus"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 md:h-12 rounded-xl bg-slate-50 border border-slate-200
                                    flex items-center justify-center gap-2
                                    text-[12.5px] md:text-[14px] font-medium text-stone-700
                                    hover:text-stone-700
                                    hover:bg-slate-100 hover:border-slate-300 transition-colors"
                        >
                            <i className="bi bi-instagram text-[16px] md:text-[18px] text-[#19766d]" />
                            Instagram
                        </a>

                        <a
                            href="https://www.t.me/link_belarus"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 md:h-12 rounded-xl bg-slate-50 border border-slate-200
                                    flex items-center justify-center gap-2
                                    text-[12.5px] md:text-[14px] font-medium text-stone-700
                                    hover:text-stone-700
                                    hover:bg-slate-100 hover:border-slate-300 transition-colors"
                        >
                            <i className="bi bi-telegram text-[16px] md:text-[18px] text-[#19766d]" />
                            Telegram
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};