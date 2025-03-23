import React, {useState} from "react";
import style from './SendGroup.module.css'
import { sendSms } from "../../http/authApi";

export const SendGroup =({phone, upload, isAuth, setIsValid})=>{

    const [codeSMS, setCodeSMS] = useState(null)
    const [codeCheck, setCodeCheck] = useState('')
    const [isFormSms, setIsFormSms] = useState(false)
    const [isSendSMS, setIsSendSMS] = useState(false)
    const [tik, setTik] = useState(60)

    const sendSMS = async() =>{
        const code = Math.floor(1000 + Math.random() * 9000);
        setCodeSMS(code)
        setIsSendSMS(true)
        TikTak()
        setTimeout(()=>{
            setIsSendSMS(false)
        }, 120000)
        await sendSms(phone, `${code} - код для подтверждения`)
        //console.log(code)
        
    }

    const TikTak = () =>{
        if(tik>0){
            setTimeout(()=>{
                setTik(prev=>prev-1)
                TikTak()
            },1000)
        }
        else setTik(120)
    }

    const ClickBtn = () => {
        // если открыто меню с кодом и код совпадает
        if (isFormSms && codeSMS === Number(codeCheck)) {
            upload();
            return;
        }
    
        // Если длина телефона 13, просто загружаем
        if (phone.length === 13) {
            upload();
            return;
        }
    
        // Если длина телефона не равна 19, выводим ошибку
        if (phone.length !== 19) {
            setIsValid(true);
            setTimeout(() => setIsValid(false), 500);
            return;
        }
    
        // Проверяем код оператора
        const code1 = phone.slice(6, 8);
        const validCodes = ["25", "29", "33", "44"];
    
        if (validCodes.includes(code1)) {
            if (isAuth) {
                upload();
            } else {
                // Если не авторизован, отправляем SMS и открываем форму для ввода кода
                sendSMS().then(() => {
                    setIsFormSms(true); // Открываем форму для ввода кода
                });
            }
        } else {
            setIsValid(true);
            setTimeout(() => setIsValid(false), 500);
            return;
        }
    };

    return(
        <div className={style.sendGroup}>

            {isFormSms ? 
            <>
                <div  className={style.sendSmsForm} style={{border: codeSMS===Number(codeCheck) && '2px solid green'}}>
                    <div style={{margin: 5, textAlign: 'center'}}>
                        <label style={{marginRight: 10}}>Код отправлен на номер: </label>
                        <label>{phone}</label>
                    </div>
                    <div className={style.smsGroup}>
                        
                        <button onClick={sendSMS} style={{ background: isSendSMS&&'rgb(200, 200, 200)'}} disabled={isSendSMS&&true}>{isSendSMS? `новый код через ${tik} сек`: ' отправить новый код'}</button>
                        <input value={codeCheck} placeholder="код из SMS" onChange={(e)=>setCodeCheck(e.target.value)} style={{textAlign: 'center'}} />
                        <label>
                        {
                            codeSMS===Number(codeCheck) ? 
                            <i style={{color: 'green', fontSize: 23}} className="bi bi-check"></i>
                            :
                            <i style={{color: 'red', fontSize: 23}} className="bi bi-x-lg"></i>
                        }
                        </label>
                        
                        
                    </div>
                </div>
                <button className={style.buttonForm}
                    style={{background: codeSMS!==Number(codeCheck) && '#632929'}} 
                    disabled={ codeSMS===Number(codeCheck) ? false: true} 
                    onClick={ClickBtn}
                >
                    <i className={codeSMS===Number(codeCheck) ?"bi bi-cart3" : "bi bi-arrow-left"} style={{color: 'black', marginRight: 10}}></i> 
                    { codeSMS===Number(codeCheck) ?  'Отправить заказ!' : 'Подтвердите номер '} 
                </button>
            </>
            :
                <button 
                    className={style.buttonForm}
                    onClick={ClickBtn}
                    style={{margin: 'auto'}}
                >
                    <i className="bi bi-cart3" style={{color: 'white', marginRight: 10}}></i> 
                    Отправить заказ!
                </button>
            }
            

            
        </div>
    )
    
}