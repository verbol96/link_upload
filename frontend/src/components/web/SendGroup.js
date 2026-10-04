import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { sendSms } from "../../http/authApi";
import { $host } from "../../http";

export const SendGroup = ({ phone, upload, isAuth, setIsValid }) => {
    const [codeSMS, setCodeSMS] = useState(null)
    const [codeCheck, setCodeCheck] = useState('')
    const [isFormSms, setIsFormSms] = useState(false)
    const [isSendSMS, setIsSendSMS] = useState(false)
    const [tik, setTik] = useState(60)

    useEffect(() => {
        if (!isSendSMS) return;

        if (tik <= 0) {
            setIsSendSMS(false);
            return;
        }

        const timer = setTimeout(() => {
            setTik(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [isSendSMS, tik]);

    const sendSMS = async () => {
        const code = Math.floor(1000 + Math.random() * 9000);
        setCodeSMS(code)
        setIsSendSMS(true)
        setTik(60)

        const isLocal = $host.defaults.baseURL?.includes('localhost')
            || $host.defaults.baseURL?.includes('192.168')
            || $host.defaults.baseURL?.includes('127.0.0.1');

        if (isLocal) setCodeCheck(String(code))
        else await sendSms(phone, `${code} - код для подтверждения`)
    }

    const ClickBtn = () => {
        if (isFormSms) {
            if (codeSMS === Number(codeCheck)) {
                upload();
            } else {
                toast.error('Неверный код', {
                    description: 'Проверьте код из СМС или запросите новый',
                });
            }
            return;
        }

        const phoneDigits = phone.replace(/\D/g, '');

        if (phoneDigits.length !== 12) {
            toast.error('Введите номер телефона', { duration: 1000 });
            setIsValid(true);
            setTimeout(() => setIsValid(false), 500);
            return;
        }

        const code1 = phoneDigits.slice(3, 5);
        const validCodes = ["25", "29", "33", "44"];

        if (validCodes.includes(code1)) {
            if (isAuth) {
                upload();
            } else {
                sendSMS().then(() => {
                    setIsFormSms(true);
                });
            }
        } else {
            toast.error('Неверный код оператора', {
                description: 'Поддерживаются: 25, 29, 33, 44',
                duration: 1000,
            });
            setIsValid(true);
            setTimeout(() => setIsValid(false), 500);
        }
    };

    const closeSms = () => {
        setIsFormSms(false);
        setCodeCheck('');
    };

    const isCodeValid = codeSMS === Number(codeCheck) && codeCheck !== '';

    return (
        <>
            <div className="w-full flex justify-end">
                <button
                    type="button"
                    onClick={ClickBtn}
                    className="w-full md:w-auto md:min-w-[220px] h-11 px-6 rounded-lg
                            bg-[#19766d] hover:bg-[#155f58] text-white
                            text-[13px] font-medium transition-colors"
                >
                    Отправить заказ
                    <i className="bi bi-arrow-right ml-2 text-[12px]" />
                </button>
            </div>

            {isFormSms && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-[1px]
                            flex items-center justify-center p-4"
                    onClick={closeSms}
                >
                    <div
                        className="relative w-full max-w-[390px] bg-white
                                rounded-2xl border border-slate-200
                                shadow-[0_16px_50px_-12px_rgba(15,23,42,0.3)]
                                px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={closeSms}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full
                                    flex items-center justify-center text-slate-400
                                    hover:bg-slate-100 hover:text-slate-600 transition"
                        >
                            <i className="bi bi-x-lg text-[13px]" />
                        </button>

                        <div className="flex items-center gap-3 pr-8">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-[#19766d]/10
                                            flex items-center justify-center">
                                <i className="bi bi-phone text-[18px] text-black" />
                            </div>

                            <div>
                                <div className="text-[16px] font-normal text-slate-800 leading-tight">
                                    Подтвердите телефон
                                </div>
                                <div className="mt-0.5 text-[12px] text-slate-400">
                                    перед отправкой заказа
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5">
                            <div className="text-[11px] text-slate-400">
                                мы отправили код на номер:
                            </div>
                            <div className="mt-0.5 text-[15px] font-medium text-slate-700">
                                {phone}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block mb-1.5 text-[11px] font-semibold text-slate-500">
                                Код из SMS
                            </label>

                            <div className="relative">
                                <input
                                    value={codeCheck}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={4}
                                    placeholder="4 цифры"
                                    onChange={(e) => setCodeCheck(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className={`w-full h-12 rounded-lg border bg-white px-3 pr-10
                                            text-[16px] md:text-[14px] font-normal text-slate-800 outline-none
                                            placeholder:text-slate-300 transition tracking-[0.15em]
                                            ${isCodeValid
                                                ? 'border-[#19766d] focus:border-[#19766d] focus:ring-2 focus:ring-[#19766d]/10'
                                                : 'border-slate-200 focus:border-[#19766d] focus:ring-2 focus:ring-[#19766d]/10'
                                            }`}
                                />

                                {codeCheck !== '' && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <i className={`bi ${isCodeValid
                                            ? 'bi-check-circle-fill text-[#19766d]'
                                            : 'bi-x-circle text-red-400'
                                            } text-[16px]`} />
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={!isCodeValid}
                            onClick={ClickBtn}
                            className="mt-3 w-full h-12 rounded-lg
                                    bg-[#19766d] hover:bg-[#155f58] text-white
                                    text-[14px] font-medium transition
                                    disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            {isCodeValid ? (
                                <>
                                    <i className="bi bi-check-lg mr-2" />
                                    Отправить заказ!
                                </>
                            ) : (
                                'Введите код из SMS'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={sendSMS}
                            disabled={isSendSMS}
                            className="mt-1.5 w-full h-9 rounded-lg
                                    text-[12px] font-medium text-slate-500
                                    hover:bg-slate-50 transition
                                    disabled:text-slate-300 disabled:cursor-not-allowed"
                        >
                            {isSendSMS ? `Новый код через ${tik} сек` : 'Отправить код ещё раз'}
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}