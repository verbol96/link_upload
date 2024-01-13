import { useState, useEffect } from 'react';
import style from './OneOrder.module.css'
import { OneOrderFile } from './OneOrderFile';
import {CopyToClipboard} from 'react-copy-to-clipboard'
import { deleteOrder, getSettings } from '../../http/dbApi';
import { deleteOrderId } from '../../store/orderReducer';
import { useDispatch, useSelector } from 'react-redux';
import { deleteFile } from '../../http/cloudApi';


export const OneOrder = ({order}) =>{

    const [selectedOrder, setSelectedOrder] = useState(false);
    const user = useSelector(state=>state.private.user)
    const [isCopy, setIsCopy] = useState(false)
    const dispatch = useDispatch()

    const handleDetailsClick = () => {
        setSelectedOrder(prev=>!prev)
    }; 
    
    const formatPhoneNumber = (phoneNumberString) => {
    const cleaned = phoneNumberString.replace(/\D/g, '');
    const match = cleaned.match(/^375(\d{2})(\d{3})(\d{2})(\d{2})$/);
    if (match) {
        return '+375 (' + match[1] + ') ' + match[2] + '-' + match[3] + '-' + match[4];
    }
    return 'неверный номер';
    }

   const StatusOrder = [
    'новый', //0
    'принят',//1
    'готов к печати',//2
    'в печати', //3
    'упакован',//4
    'отправлен',//5
    'получен',//6
    ]

    const ShowPost =() =>{
        switch(order.typePost){
            case 'E': return 'Европочта'
            case 'R': {
                if(order.firstClass) return 'Белпочта (письмо 1 класс)'
                return 'Белпочта'
            }
            default: return 'Европочта'
        }
    }

    const DeleteOrder = async() =>{
        const userConfirmation = window.confirm("Вы уверены, что хотите удалить этот заказ?");
    
        if (userConfirmation) {
          await deleteOrder(order.id);
          dispatch(deleteOrderId(order.id));
          await deleteFile(order.main_dir_id)
        }
    }

    const MessageStatus = [
        <label>Заказ поступил нам. Ожидает проверки сотрудником. В этом статусе вы еще можете <span style={{color:'red', cursor: 'pointer'}} onClick={()=>{DeleteOrder()}}>удалить заказ</span></label>,// новый
        'Заказ проверен сотрудником. Сейчас подготавливаем файлы к печати.',//принят
        'Файлы подготовлены к печати. Заказ в очереди на печать.',// обработан
        'Заказ сейчас находится на стадии печати.',// в печати
        'Печать заказа завершена, и он был аккуратно упакован для безопасной пересылки.',// упакован
        'Ваш заказ был передан на отправку. По штрихкоду можете его отслеживать.',// отправлен
        '' //оплачен
      ]
    const CopyCode =  () =>{
        setIsCopy(true)
        setTimeout(()=>{
            setIsCopy(false)
        }, 1500)
    }

    const SumTeor =()=> {
        const pr = order.photos.reduce((sum, el)=>{
            return sum+PriceList(el.format)*el.amount
        },0 )

        return pr.toFixed(2)
    }

    const [settings, setSettings] = useState([])

    useEffect(()=>{
        async function getPriceList (){
            let value = await getSettings()
            setSettings(value)
        }
        getPriceList()

    }, [])

    const PriceList = (format) =>{
        let price = 0
        settings.forEach(el=>{
        
            if(el.title === format) {
            
                price = el.price
            }
        })

        return price
    }

    return(
        <>
        {
            selectedOrder ?
                <div className={style.desc}>
                    <div onClick={()=>handleDetailsClick()}>
                        <div> <i style={{fontSize: 25, color: '#116466'}} className="bi bi-caret-up-fill"></i></div>
                    </div>

                    <div className={style.contact}>
                        <div style={{flex: 2, display: 'flex', flexDirection: 'row', border: '1px solid silver', borderRadius:5, padding: '10px 10px' ,gap: 10}}>

                            <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 5}}>
                                <div style={{display: 'flex', flexDirection: 'row'}}>
                                    <div style={{flex: 2}}>дата:</div>
                                    <div style={{flex: 5, fontWeight: 600}}>{order.createdAt.split("T")[0].split("-")[2]}.{order.createdAt.split("T")[0].split("-")[1]}</div>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'row', marginTop:15}}>
                                    <div style={{flex: 2}}>имя:</div>
                                    <div style={{flex: 5, fontWeight: 600}}>{order.FIO}</div>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'row'}}>
                                    <div style={{flex: 2}}>номер:</div>
                                    <div style={{flex: 5, fontWeight: 600}}>{formatPhoneNumber(order.phone)}</div>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'row', marginTop:15}}>
                                    <div style={{flex: 2}}>почта:</div>
                                    <div style={{flex: 5, fontWeight: 600}}>{ShowPost() }</div>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'row'}}>
                                    <div style={{flex: 2}}>город:</div>
                                    <div style={{flex: 5, fontWeight: 600}}>{order.city}</div>
                                </div>
                                
                                {order.typePost==='R' && 
                                <div style={{display: 'flex', flexDirection: 'row'}}>
                                    <div style={{flex: 2}}>индекс:</div>
                                    <div style={{flex: 5, fontWeight: 600}}>{order.postCode}</div>
                                </div>
                                }
                                <div style={{display: 'flex', flexDirection: 'row'}}>
                                    <div style={{flex: 2}}>адрес:</div>
                                    <div style={{flex: 5, fontWeight: 600}}>{order.adress}</div>
                                </div>
                            </div>

                        </div>

                        <div style={{flex: 3, display: 'flex', flexDirection:'column', justifyContent:'space-between', border: '1px solid silver', padding: 10, borderRadius:5, gap: 10}}>
                            <div className={style.rowInfo}>
                                <div style={{flex: 1}}>статус заказа:</div>
                                <div style={{flex: 3}}>
                                    <button style={{backgroundColor: order.status === 6 || order.status === 5 ? 'grey' : '#3AAFA9', 
                                                    border: 'none', borderRadius: 5,  width:'100%', color: 'white', fontWeight:600,}}>
                                        {StatusOrder[order.status]}
                                    </button>
                                    <label style={{fontSize: 11}}>
                                        {MessageStatus[order.status]}
                                    </label>
                                </div>
                                
                            </div>
                            <div className={style.rowInfo}>
                                <div style={{flex: 1}}>штрихкод: </div>
                                <div style={{display: "flex", flex: 3, fontSize: 11, gap:1}}>
                                    <button style={{fontWeight:600, border: '1px solid silver', borderRadius: 5, flex: '2', textAlign: 'center', background:'white'}}> {order.codeOutside? order.codeOutside: '-'}</button>
                                    {order.typePost==='R' &&
                                    <button className={style.btnInfo}
                                        onClick={() => {
                                            if (order.codeOutside) {
                                                if(order.type==='R') window.open(`https://belpost.by/Otsleditotpravleniye?number=${order.codeOutside}`, '_blank');
                                                
                                            
                                            }
                                        }}
                                        >   
                                            отследить
                                    </button>
                                    }
                                    <CopyToClipboard text={order.codeOutside || ' '}>
                                    <button className={style.btnInfo}
                                        onClick={()=>CopyCode()}
                                    >
                                            копировать {isCopy && <i style={{color: 'green'}} className="bi bi-clipboard-check"></i>}
                                    </button>
                                    </CopyToClipboard>
                                </div>
                            </div>

                            <div className={style.rowInfo}>
                                <div style={{flex: 1, maxWidth: '25%'}}>примечания:</div>
                                <div style={{flex: 3, fontSize: 11}}>
                                <textarea disabled rows={2} value={order.other} onChange={()=>{}} style={{ border: '1px solid silver', borderRadius: 5, width: '100%'}}></textarea>
                                </div>
                            </div>
                             
                            <div className={style.rowInfo}>
                                <div style={{flex: 1}}>сумма заказа:</div>
                                <div style={{flex: 3, fontWeight: 600}}>
                                {(Number(order.price)).toFixed(2)}р 
                                {order.price_deliver==='0' ? 
                                    <span style={{fontWeight: 400}}> + пересылка  <i style={{color: 'black'}} className="bi bi-question-lg"></i>р </span>
                                :
                                    <span style={{fontWeight: 400}}> +{order.price_deliver}р пересылка</span>
                                }
                                </div>
                                
                            </div>
                            {user.role !== 'USER' &&
                                <div style={{ display: 'flex', justifyContent: 'flex-start', fontSize: 12,  gap: 10 }}>
                                    <div style={{flex: 1}}>
                                    </div>
                                    
                                    <div style={{flex: 3, display: 'flex', flexDirection: 'row', gap: 20}}>
                                        <div>
                                            <label style={{fontSize: 15, color: 'black'}}>LINK =</label>
                                            <label>{(SumTeor()*0.8).toFixed(2)}р</label>
                                        </div>
                                        <div>
                                            <label><i style={{fontSize: 15, color: 'black'}} className="bi bi-currency-dollar"></i>=</label>
                                            <label>
                                                {order.firstClass?
                                                (-Number(order.price)-Number(order.price_deliver)).toFixed(2)
                                                :
                                                (Number(order.price)-SumTeor()*0.8).toFixed(2)
                                                }р
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>

                    <div className={style.files}>
                        
                        {order.photos.map((el,index)=><OneOrderFile key={index} el={el} />)}

                    </div>
                   
                </div>
            :
                <div onClick={()=>handleDetailsClick()} className={style.row}>
                    <div style={{flex: 1}}> <i style={{fontSize: 20, color: '#116466'}} className="bi bi-caret-down-fill"></i></div>
                    <div style={{flex: 1}}> {order.createdAt.split("T")[0].split("-")[2]}.{order.createdAt.split("T")[0].split("-")[1]}</div>
                    <div className={style.mobileNone}>  {order.FIO}</div>
                    <div className={style.laptopNone}>  {order.FIO.split(' ')[0] && order.FIO.split(' ')[0]}</div>
                    <div className={style.mobileNone}> {formatPhoneNumber(order.phone)}</div>
                    <div className={style.mobileNone}> {order.city}</div>
                    <div style={{flex: 1, minWidth: 50}}> {(Number(order.price)+Number(order.price_deliver)).toFixed(2)}р</div>
                    <div style={{flex: 3, maxWidth: '25%'}}><button style={{backgroundColor: order.status === 6 ||order.status === 5 ? 'grey' : '#3AAFA9',  
                                        border: 'none', borderRadius: 5, width:'100%', color: 'white'}}>{StatusOrder[order.status]}</button></div>
               
                </div>
        }
       
        </>
    )
}