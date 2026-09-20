import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../http/authApi';
import { useEffect } from 'react';

export const PageAfterUpload = ({ amountPhoto, phone }) => {

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isAuth = useSelector(state => state.auth.auth);

    const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');

    useEffect(() => {
        if (isAuth) return;

        const login1 = async () => {
            const data = await login(removeNonNumeric(phone));
            if (typeof data === 'object') dispatch({ type: 'authStatus', paylods: true });
        };

        login1();
    }, [dispatch, isAuth, phone]);

    return (
        <div className="flex-1 w-full flex items-center justify-center px-4 py-10 md:py-20">
            <div className="w-[90%] md:w-[80%] max-w-2xl bg-white rounded-2xl
                            border border-stone-200
                            shadow-[0_10px_40px_-10px_rgba(44,53,49,0.15)]
                            px-[6vw] py-[8vw] md:px-12 md:py-14">

                {/* === Анимированная галочка === */}
                <div className="flex justify-center mb-6">
                    <div className="relative w-20 h-20">

                        {/* Иконка галочки в зелёном круге */}
                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-14 h-14 rounded-full bg-green-500
                                            flex items-center justify-center
                                            shadow-[0_6px_20px_-4px_rgba(34,197,94,0.5)]">
                                <i className="bi bi-check-lg text-white text-2xl" />
                            </span>
                        </span>
                    </div>
                </div>

                {/* === Заголовок === */}
                <div className="text-center mb-8">
                    <h4 className="text-[20px] md:text-[24px] font-bold text-[#2C3531]
                                leading-tight mb-2">
                        Заказ успешно отправлен!
                    </h4>
                    <div className="inline-flex items-center gap-1.5
                                    bg-green-50 text-green-700
                                    px-3 py-1 rounded-full
                                    text-[12.5px] md:text-[13px] font-medium">
                        <i className="bi bi-check-circle-fill text-[13px]" />
                        Загружено {amountPhoto} фото
                    </div>
                </div>

                {/* === Разделитель === */}
                <div className="border-t border-dashed border-stone-200 mb-6" />

                {/* === Основная информация === */}
                <div className="text-center">
                    <p className="text-[14px] md:text-[15px] text-stone-600 leading-relaxed">
                        Проверить заказ и его статус можно в{' '}
                        <button
                            onClick={() => navigate('/private')}
                            className="inline-flex items-center gap-1
                                    text-[#2C3531] font-medium underline underline-offset-2
                                    decoration-stone-300 hover:decoration-[#2C3531]
                                    transition-colors"
                        >
                            личном кабинете
                            <i className="bi bi-house-door text-[13px]" />
                        </button>
                    </p>
                </div>

                {/* === Подсказка про соцсети === */}
                <div className="mt-10 pt-6 border-t border-dashed border-stone-200">
                    <p className="text-[11.5px] md:text-[12px] text-stone-400 leading-relaxed text-center">
                        Так же получить любую информацию о заказе можно, написав нам в{' '}
                        <a
                            href="https://www.instagram.com/link.belarus"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-600 font-medium hover:text-[#0D9488]
                                    inline-flex items-center gap-0.5 transition-colors"
                        >
                            <i className="bi bi-instagram text-[11px]" />
                            Instagram
                        </a>
                        {' '}либо{' '}
                        <a
                            href="https://www.t.me/link_belarus"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-600 font-medium hover:text-[#0D9488]
                                    inline-flex items-center gap-0.5 transition-colors"
                        >
                            <i className="bi bi-telegram text-[11px]" />
                            Telegram
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
};