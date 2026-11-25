import InputMask from 'react-input-mask';
import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { login, sendSms, setLogUserData } from '../http/authApi';
import { getOneUser } from '../http/dbApi';
import { setUser } from '../store/privatePageReducer';
import { useDispatch } from 'react-redux';
import { NavBar } from '../components/admin/NavBar';
import { $host } from '../http';

import {
    GUEST_PROTECTED_ROUTES,
    getSectionTitle,
} from '../routes/access';

export const Auth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState(null);
    const [codeSMS, setCodeSMS] = useState(null);

    const [isSend, setIsSend] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [isValid1, setIsValid1] = useState(false);
    const [disableSms, setDisableSms] = useState(false);
    const [tik, setTik] = useState(60);

    const codeInputRef = useRef(null);

    const requestedPage = GUEST_PROTECTED_ROUTES.includes(
        location.state?.from
    )
        ? location.state.from
        : null;

    const requestedSection = requestedPage
        ? getSectionTitle(requestedPage)
        : null;

    const removeNonNumeric = (phoneNumber) =>
        phoneNumber.replace(/[^0-9+]/g, '');

    const handleAuth = async () => {
        if (codeSMS !== password) {
            setIsValid1(true);
            setTimeout(() => setIsValid1(false), 500);
            return;
        }

        try {
            const data = await login(removeNonNumeric(phone));

            if (typeof data === 'object' && data !== null) {
                const userData = await getOneUser(
                    removeNonNumeric(phone)
                );

                dispatch(setUser(userData));
                setLogUserData(userData.user);

                dispatch({
                    type: 'authStatus',
                    paylods: true,
                });

                navigate(requestedPage || '/myOrders', {
                        replace: true,
                    });
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
        }
    };

    const SendSms = async () => {
        if (phone.length !== 19) {
            setIsValid(true);
            setTimeout(() => setIsValid(false), 500);
            return;
        }

        const code1 = phone.slice(6, 8);
        const validCodes = ['25', '29', '33', '44'];

        if (validCodes.includes(code1)) {
            setPassword('');

            const code = Math.floor(1000 + Math.random() * 9000);

            setCodeSMS(code);

            if (
                $host.defaults.baseURL ===
                `http://${window.location.hostname}:8002/`
            ) {
                setPassword(code);
            } else {
                await sendSms(
                    removeNonNumeric(phone),
                    `${code} - код для подтверждения`
                );
            }

            setIsSend(true);

            setTimeout(() => {
                codeInputRef.current?.focus();
            }, 0);

            setDisableSms(true);
            TikTak();

            setTimeout(() => {
                setDisableSms(false);
            }, 60000);
        } else {
            setIsValid(true);
            setTimeout(() => setIsValid(false), 500);
        }
    };

    const TikTak = () => {
        if (tik > 0) {
            setTimeout(() => {
                setTik((prev) => prev - 1);
                TikTak();
            }, 1000);
        } else {
            setTik(60);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FAFBFD]">
            <NavBar />

            <div
                className="flex-1 w-full flex items-center
                           justify-center px-4 py-10"
            >
                <div
                    className="w-full max-w-md bg-white
                               border border-slate-200
                               rounded-2xl shadow-sm p-6 md:p-8"
                >
                    {/* Заголовок */}
                    <div className="mb-6 text-center">
                        <h1
                            className="text-[20px] font-normal text-slate-800"
                        >
                            Вход в личный кабинет
                        </h1>

                        {requestedPage && (
                            <p
                                className="mt-3 text-[12.5px]
                                           text-slate-500 leading-relaxed"
                            >
                                Для доступа к разделу
                                {' '}«{requestedSection || 'Личный кабинет'}»
                                {' '}необходимо войти.
                            </p>
                        )}
                    </div>

                    {/* Форма */}
                    <div className="flex flex-col gap-4">

                        {/* Телефон */}
                        <div>
                            <label
                                className="text-[12px] text-slate-500
                                           font-medium block mb-1.5"
                            >
                                Номер телефона
                            </label>

                            <InputMask
                                value={phone}
                                mask="+375 (99) 999-99-99"
                                placeholder="+375 (__) ___-__-__"
                                maskChar="_"
                                className={`w-full h-12 px-4 rounded-lg
                                    bg-slate-50 text-[16px] text-slate-800
                                    placeholder:text-slate-400
                                    focus:outline-none focus:bg-white
                                    focus:ring-2 focus:ring-[#274c77]/20
                                    focus:border-[#274c77]
                                    transition-colors
                                    ${
                                        isValid
                                            ? 'border-2 border-red-500'
                                            : 'border border-slate-200'
                                    }`}
                                onChange={(e) =>
                                    setPhone(e.target.value)
                                }
                            />
                        </div>

                        {/* Код из СМС */}
                        {isSend && (
                            <div>
                                <label
                                    className="text-[12px] text-slate-500
                                               font-medium block mb-1.5"
                                >
                                    Код из СМС
                                </label>

                                <input
                                    ref={codeInputRef}
                                    value={password}
                                    placeholder="••••"
                                    maxLength={4}
                                    className={`w-full h-12 px-4 rounded-lg
                                        bg-slate-50 text-[16px]
                                        text-slate-800 text-center
                                        tracking-[0.5em] font-semibold
                                        placeholder:text-slate-400
                                        placeholder:tracking-normal
                                        placeholder:font-normal
                                        focus:outline-none focus:bg-white
                                        focus:ring-2 focus:ring-[#274c77]/20
                                        transition-colors
                                        ${
                                            isValid1
                                                ? 'border-2 border-red-500'
                                                : 'border border-slate-200'
                                        }`}
                                    onChange={(e) =>
                                        setPassword(Number(e.target.value))
                                    }
                                />
                            </div>
                        )}

                        {/* Основная кнопка */}
                        <div className="flex flex-col items-center gap-3">
                            <button
                                onClick={() =>
                                    isSend
                                        ? handleAuth()
                                        : SendSms()
                                }
                                className="w-full h-12 rounded-lg
                                           bg-[#274c77] hover:bg-[#1e3a5d]
                                           text-white text-[14px] font-medium
                                           transition-colors active:scale-[0.98]"
                            >
                                {isSend ? 'Войти' : 'Получить код'}
                            </button>

                            <p
                                className="text-[12.5px] text-slate-400 text-center"
                            >
                                Введите номер — пришлём код в СМС
                            </p>
                        </div>

                        {/* Повторная отправка */}
                        {isSend && (
                            <button
                                onClick={() => SendSms()}
                                disabled={disableSms}
                                className="w-full py-2 rounded-lg
                                           text-[12.5px] font-medium
                                           text-slate-500 hover:text-slate-700
                                           hover:bg-slate-100
                                           disabled:text-slate-400
                                           disabled:cursor-not-allowed
                                           disabled:hover:bg-transparent
                                           transition-colors tabular-nums"
                            >
                                {disableSms
                                    ? `Повторно через ${tik} с`
                                    : 'Отправить код заново'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
