import React, { useState } from "react";
import { sendSms } from "../../http/authApi";
import { $host } from "../../http";

export const SendGroup = ({ phone, upload, isAuth, setIsValid }) => {

    const [codeSMS, setCodeSMS] = useState(null)
    const [codeCheck, setCodeCheck] = useState('')
    const [isFormSms, setIsFormSms] = useState(false)
    const [isSendSMS, setIsSendSMS] = useState(false)
    const [tik, setTik] = useState(60)

    const sendSMS = async () => {
        const code = Math.floor(1000 + Math.random() * 9000);
        setCodeSMS(code)
        setIsSendSMS(true)
        TikTak()
        setTimeout(() => {
            setIsSendSMS(false)
        }, 120000)
        if ($host.defaults.baseURL === 'http://localhost:8002/') console.log(code)
        else await sendSms(phone, `${code} - код для подтверждения`)
    }

    const TikTak = () => {
        if (tik > 0) {
            setTimeout(() => {
                setTik(prev => prev - 1)
                TikTak()
            }, 1000)
        }
        else setTik(120)
    }

    const ClickBtn = () => {
        if (isFormSms && codeSMS === Number(codeCheck)) {
            upload();
            return;
        }

        if (phone.length === 13) {
            upload();
            return;
        }

        if (phone.length !== 19) {
            setIsValid(true);
            setTimeout(() => setIsValid(false), 500);
            return;
        }

        const code1 = phone.slice(6, 8);
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
            setIsValid(true);
            setTimeout(() => setIsValid(false), 500);
            return;
        }
    };

    return (
        <div className="pr-0 md:pr-[5vw] my-[10px] md:my-4 md:mb-8 flex flex-col md:flex-row md:justify-between font-normal">

            {isFormSms ?
                <>
                    <div
                        className="bg-[#f9f9f9] rounded-[5px] px-[30px] py-[15px]
                                shadow-[0px_0px_6px_1px_rgba(61,96,94,0.38)]"
                        style={{ border: codeSMS === Number(codeCheck) ? '2px solid green' : '2px solid #874545' }}
                    >
                        <div className="m-[5px] text-center">
                            <label className="mr-[10px]">Код отправлен на номер: </label>
                            <label>{phone}</label>
                        </div>

                        <div className="flex flex-col md:flex-row md:justify-between gap-[10px]">

                            <button
                                onClick={sendSMS}
                                disabled={isSendSMS}
                                className="border-none text-white rounded-[5px] px-5
                                        min-w-[200px] h-[35px] md:h-auto
                                        shadow-[2px_4px_4px_rgba(0,0,0,0.3)]"
                                style={{ background: isSendSMS ? 'rgb(200, 200, 200)' : 'rgb(119, 119, 119)' }}
                            >
                                {isSendSMS ? `новый код через ${tik} сек` : ' отправить новый код'}
                            </button>

                            <input
                                value={codeCheck}
                                placeholder="код из SMS"
                                onChange={(e) => setCodeCheck(e.target.value)}
                                className="border border-[#616161] rounded-[5px] text-center
                                        h-[35px] w-full md:w-auto px-3"
                            />

                            <label className="hidden md:block text-center">
                                {codeSMS === Number(codeCheck) ?
                                    <i style={{ color: 'green', fontSize: 23 }} className="bi bi-check"></i>
                                    :
                                    <i style={{ color: 'red', fontSize: 23 }} className="bi bi-x-lg"></i>
                                }
                            </label>
                        </div>
                    </div>

                    <button
                        className="w-full md:w-[30vw] text-[1.2rem] text-white rounded-[5px]
                                text-center cursor-pointer
                                transition-[color_1s,background-color_0.5s,transform_1s]
                                shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)]
                                px-[30px] py-[15px]
                                hover:shadow-[0_5px_5px_rgba(0,0,0,0.05),0_5px_5px_rgba(0,0,0,0.05)]
                                hover:scale-[1.03]
                                disabled:cursor-not-allowed"
                        style={{ background: codeSMS !== Number(codeCheck) ? '#632929' : '#093e3f' }}
                        disabled={codeSMS === Number(codeCheck) ? false : true}
                        onClick={ClickBtn}
                    >
                        <i
                            className={codeSMS === Number(codeCheck) ? "bi bi-cart3" : "bi bi-arrow-left"}
                            style={{ color: 'black', marginRight: 10 }}
                        ></i>
                        {codeSMS === Number(codeCheck) ? 'Отправить заказ!' : 'Подтвердите номер '}
                    </button>
                </>
                :
                <button
                    className="w-full md:w-[30vw] text-[1.2rem] text-white bg-[#093e3f]
                            rounded-[5px] text-center cursor-pointer
                            transition-[color_1s,background-color_0.5s,transform_1s]
                            shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)]
                            px-[30px] py-[15px]
                            hover:bg-[#116466]
                            hover:shadow-[0_5px_5px_rgba(0,0,0,0.05),0_5px_5px_rgba(0,0,0,0.05)]
                            hover:scale-[1.03]
                            md:mx-auto"
                    onClick={ClickBtn}
                >
                    <i className="bi bi-cart3" style={{ color: 'white', marginRight: 10 }}></i>
                    Отправить заказ!
                </button>
            }
        </div>
    )
}