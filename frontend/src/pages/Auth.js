import Footer from "../components/admin/Footer"
import InputMask from 'react-input-mask';
import { useState } from "react";
import { login, sendSms } from "../http/authApi";
import { useDispatch } from 'react-redux';
import style from './Auth.module.css'
import { NavBar } from "../components/admin/NavBar";

export const Auth = () =>{ 
 
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
        
        if(codeSMS!==password) {
            setIsValid1(true)
            setTimeout(()=>setIsValid1(false), 500)
            return;
        }
        const data = await login(removeNonNumeric(phone));

        if (typeof data === 'object') {
            dispatch({ type: 'authStatus', paylods: true });
        }
    };

    const SendSms = async() =>{
        if(phone.length!==19) {
            setIsValid(true)
            setTimeout(()=>setIsValid(false), 500)
            return;
        }

        const code1 = phone.slice(6, 8); 
        const validCodes = ["25", "29", "33", "44"];

        if (validCodes.includes(code1)) { 
            const code = Math.floor(1000 + Math.random() * 9000);
            setCodeSMS(code)
            await sendSms(removeNonNumeric(phone), `${code} - код для подтверждения`)
            //console.log(code)
            setPassword('')
            setIsSend(true)
            setDisableSms(true)
            TikTak()
            setTimeout(()=>{
                setDisableSms(false)
            }, 60000)
        } else {
            setIsValid(true)
            setTimeout(()=>setIsValid(false), 500)
            return;
        }
    }

    const TikTak = () =>{
        if(tik>0){
            setTimeout(()=>{
                setTik(prev=>prev-1)
                TikTak()
            },1000)
        }
        else setTik(60)
    }


    return(
        <div style={{display: 'flex', flexDirection: 'column',background: '#e8e8e8', minHeight: '100vh'}}>
            <NavBar />

            <div className={style.auth}>
                <div className={style.row}>
                    <label className={style.title}>Вход в личный кабинет</label>
                </div>
                
                    <div className={style.row}>
                        
                        <InputMask
                            value={phone}
                            mask="+375 (99) 999-99-99"
                            placeholder="номер телефона"
                            maskChar={''}
                            className={style.inputForm} 
                            style={{border: isValid&&'2px solid red'}}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                
               {
                isSend ? 
                    <>
                        <div className={style.row}>
                            <input
                                value={password}
                                className={style.inputForm}
                                placeholder="код из смс"
                                style={{border: isValid1&&'2px solid red'}}
                                maxLength={4}
                                onChange={(e) => setPassword(Number(e.target.value))}
                            />
                        </div>
                        <div className={style.row}>
                            
                            <button
                                onClick={() => Auth()}
                                className={style.btnSend}
                            >
                                Войти
                            </button>
                        </div>
                        <div className={style.row}>
                            <label
                                onClick={() => SendSms()}
                                className='bg-gray-100 py-1 px-3 rounded-md text-xs'
                                disabled={disableSms&&true}
                            >
                                {disableSms?`Отправлено (${tik})`:'Повторно отправить код'}
                                
                            </label>
                        </div>
                        
                    </>
                :
                    <div className={style.row}>
                        
                        <button
                            onClick={() => SendSms()}
                            className={style.btnSend}
                        >
                            Отправить СМС с кодом
                        </button>
                    </div>
               }
               
            </div>

            <div style={{marginTop: 'auto'}}>
                <Footer />
            </div>
        </div>
    )
}