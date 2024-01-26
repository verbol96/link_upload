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
        }, 60000)
        await sendSms(phone, `${code} - код для подтверждения`)
        
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

    const ClickBtn = () =>{
        if(phone.length!==13 && phone.length!==19) {
            setIsValid(true)
            setTimeout(()=>setIsValid(false), 500)
            return;
        }
        
        if(isAuth) upload()
        else{
            setIsFormSms(true)
            if(codeSMS===Number(codeCheck)) upload()
        }
    }

    return(
        <div className={style.sendGroup}>

            {isFormSms ? 
            <>
                <div  className={style.sendSmsForm} style={{border: codeSMS===Number(codeCheck) && '2px solid green'}}>
                    <div style={{margin: 5, textAlign: 'center'}}>
                        <label style={{marginRight: 10}}>Подтверждение номера: </label>
                        <label>{phone}</label>
                    </div>
                    <div className={style.smsGroup}>
                        <button onClick={sendSMS} disabled={isSendSMS&&true}>{isSendSMS? `отправлен(${tik})`: ' отправить код'}</button>
                        <input value={codeCheck} placeholder="код из СМС" onChange={(e)=>setCodeCheck(e.target.value)} style={{textAlign: 'center'}} />
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