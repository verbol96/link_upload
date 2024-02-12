import InputMask from 'react-input-mask';
import './styleWeb.css'
import style from './ContactForm.module.css'

export const ContactForm = ({FIO,setFIO,phone,setPhone,typePost,setTypePost,city,setCity,
    adress,setAdress,postCode,setPostCode, other, setOther, isValid})=>{


     
    return(
        <>
        <div className={style.contactForm}>
            <div>
                <h4 className={style.textH4}>
                    <i className="bi bi-2-square" style={{color: 'black', marginRight: 10}}></i> Данные для отправки  
                </h4>
            </div>

            <div className={style.rowInfo}>
                <div className={style.containerInput}> 
                    <label className={style.labelForm} >Телефон:</label>
                    <InputMask
                        value={phone}
                        mask="+375 (99) 999-99-99"
                        maskChar={''}
                        className={style.inputForm} 
                        style={{border: isValid&&'2px solid red'}}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>  

                <div className={style.containerInput}>
                    <label className={style.labelForm} >ФИО:</label>
                    <input className={style.inputForm}  value={FIO} onChange={(e)=>setFIO(e.target.value)} />
                </div> 
            </div>
           
            <div className={style.rowInfo}>
                <div className={style.containerSelect} style={{flex: 3}}>
                    <label className={style.labelSelect}>Тип отправки:</label>
                    <select className={style.selectForm} defaultValue={typePost} onChange={(e)=>setTypePost(e.target.value)}>
                            <option value={'E'}>Европочта</option>
                            <option value={'R'}>Белпочта</option>
                            <option value={'R1'}>Белпочта(1 класс)</option>
                    </select>
                    <span className={style.selectArrow}>▼</span>
                </div>
                
                {
                    (typePost==='R' || typePost==='R1') &&
                    <div className={style.containerInput} style={{flex: 1}}>
                        <label className={style.labelForm} >Индекс:</label>
                        <input className={style.inputForm}   value={postCode} onChange={(e)=>setPostCode(e.target.value)}  />
                    </div>
                }
                
                <div className={style.containerInput} style={{flex: 2}}>
                    <label className={style.labelForm} >Город:</label>
                    <input className={style.inputForm}   value={city} onChange={(e)=>setCity(e.target.value)}  />
                </div>
                <div className={style.containerInput} style={{flex: 5}}>
                    {
                    (typePost==='R' || typePost==='R1') ?
                    <label className={style.labelForm} >Улица, дом, квартира:</label>
                    :
                    <label className={style.labelForm} >Номер отделения либо его адрес:</label>
                    }
                    <input className={style.inputForm}  value={adress} onChange={(e)=>setAdress(e.target.value)}  />
                </div>
            </div>
            
 
            <div className={style.rowInfo} style={{marginTop: 50}}>
                <div className={style.containerInput}>
                    <label className={style.labelForm}>Примечания:</label>
                    <textarea className={style.textAreaForm} rows={2} value={other} onChange={(e) => setOther(e.target.value)}></textarea>
                </div>
            </div>
            
            
            </div>
            </>
    )
}