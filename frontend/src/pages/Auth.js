import Footer from "../components/admin/Footer"
import InputMask from 'react-input-mask';
import { useState } from "react";
import { login, sendSms } from "../http/authApi";
import { useDispatch } from 'react-redux';
import { NavBar } from "../components/admin/NavBar";
import { $host } from "../http";

export const Auth = () => {

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState(null);
    const [codeSMS, setCodeSMS] = useState(null)
    const dispatch = useDispatch();
    const [isSend, setIsSend] = useState(false)
    const [isValid, setIsValid] = useState(false)
    const [isValid1, setIsValid1] = useState(false)
    const [disableSms, setDisableSms] = useState(false)
    const [tik, setTik] = useState(60)

    const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');

    const Auth = async () => {
        if (codeSMS !== password) {
            setIsValid1(true)
            setTimeout(() => setIsValid1(false), 500)
            return;
        }
        const data = await login(removeNonNumeric(phone));

        if (typeof data === 'object') {
            dispatch({ type: 'authStatus', paylods: true });
        }
    };

    const SendSms = async () => {
        if (phone.length !== 19) {
            setIsValid(true)
            setTimeout(() => setIsValid(false), 500)
            return;
        }

        const code1 = phone.slice(6, 8);
        const validCodes = ["25", "29", "33", "44"];

        if (validCodes.includes(code1)) {
            setPassword('')
            const code = Math.floor(1000 + Math.random() * 9000);
            setCodeSMS(code)
            if ($host.defaults.baseURL === `http://${window.location.hostname}:8002/`) {
                setPassword(code)
            }
            else await sendSms(removeNonNumeric(phone), `${code} - код для подтверждения`)
            setIsSend(true)
            setDisableSms(true)
            TikTak()
            setTimeout(() => {
                setDisableSms(false)
            }, 60000)
        } else {
            setIsValid(true)
            setTimeout(() => setIsValid(false), 500)
            return;
        }
    }

    const TikTak = () => {
        if (tik > 0) {
            setTimeout(() => {
                setTik(prev => prev - 1)
                TikTak()
            }, 1000)
        }
        else setTik(60)
    }

    return (
        <div className="flex flex-col min-h-screen bg-stone-100">
            <NavBar />

            <div className="flex-1 w-full flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl
                                shadow-sm p-6 md:p-8">

                    {/* Заголовок */}
                    <div className="mb-6 text-center">
                     
                        <h1 className="text-[20px] font-normal text-teal-950">
                            Вход в личный кабинет
                        </h1>
                    </div>

                    {/* Форма */}
                    <div className="flex flex-col gap-4">

                        {/* Телефон */}
                        <div>
                            <label className="text-[12px] text-stone-500 font-medium block mb-1.5">
                                Номер телефона
                            </label>
                            <InputMask
                                value={phone}
                                mask="+375 (99) 999-99-99"
                                placeholder="+375 (__) ___-__-__"
                                maskChar={'_'}
                                className={`w-full h-12 px-4 rounded-lg
                                            bg-stone-50 text-[15px] text-stone-800
                                            placeholder:text-stone-400
                                            focus:outline-none focus:bg-white
                                            focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488]
                                            transition-colors
                                            ${isValid
                                                ? 'border-2 border-red-500'
                                                : 'border border-stone-200'
                                            }`}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        {/* Код из СМС */}
                        {isSend && (
                            <div>
                                <label className="text-[12px] text-stone-500 font-medium block mb-1.5">
                                    Код из СМС
                                </label>
                                <input
                                    value={password}
                                    placeholder="••••"
                                    maxLength={4}
                                    className={`w-full h-12 px-4 rounded-lg
                                                bg-stone-50 text-[15px] text-stone-800 text-center
                                                tracking-[0.5em] font-semibold
                                                placeholder:text-stone-400 placeholder:tracking-normal placeholder:font-normal
                                                focus:outline-none focus:bg-white
                                                focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488]
                                                transition-colors
                                                ${isValid1
                                                    ? 'border-2 border-red-500'
                                                    : 'border border-stone-200'
                                                }`}
                                    onChange={(e) => setPassword(Number(e.target.value))}
                                />
                            </div>
                        )}

                       {/* Основная кнопка + подпись */}
                        <div className="flex flex-col items-center gap-3">
                            <button
                                onClick={() => isSend ? Auth() : SendSms()}
                                className="w-full h-12 rounded-lg
                                        bg-teal-900 hover:bg--teal-950
                                        text-white text-[14px] font-medium
                                        transition-colors active:scale-[0.98]"
                            >
                                {isSend ? 'Войти' : 'Получить код'}
                            </button>

                            <p className="text-[12.5px] text-stone-400 text-center">
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
                                        text-stone-500 hover:text-stone-700 hover:bg-stone-100
                                        disabled:text-stone-400 disabled:cursor-not-allowed disabled:hover:bg-transparent
                                        transition-colors tabular-nums"
                            >
                                {disableSms ? `Повторно через ${tik} с` : 'Отправить код заново'}
                            </button>
                        )}
                    </div>

                </div>
            </div>

            <Footer />
        </div>
    )
}