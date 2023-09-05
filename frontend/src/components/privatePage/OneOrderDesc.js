import { useDispatch, useSelector } from 'react-redux';
import { deleteOrder, updateOrder } from '../../http/dbApi';
import { deleteOrderId } from '../../store/orderReducer';
import './OneOrderDesc.css'
import {useState, useEffect} from 'react'
import { updateOrderPrivate } from '../../store/privatePageReducer';

export const OneOrderDesc = ({order, setSelectedOrder, handleDetailsClick, StatusOrder}) =>{

    const dispatch = useDispatch() 
    const user = useSelector(state=>state.private.user)

    const [price] = useState(order.price || '');
    const [typePost, setTypePost] = useState(order.typePost)
    const [FIO, setFIO] = useState(order.FIO || '')
    const [phone, setPhone] = useState(order.phone || '')
    const [city, setCity] = useState(order.city || '')
    const [adress, setAdress] = useState(order.adress || '')
    const [oblast] = useState(order.oblast || '')
    const [raion] = useState(order.raion || '')
    const [postCode, setPostCode] = useState(order.postCode || '')
    const [firstClass] = useState(order.firstClass || false)
    const [other, setOther] =useState(order.other || '')
    const [photo] = useState(order.photos || [])
    const [phoneUser] = useState(user.phone || '');
    const [notes,] = useState(order.notes || '')
    const [codeOutside, setCodeOutside] = useState(order.codeOutside || '')

    const [numRows, setNumRows] = useState(2);

    useEffect(() => {
        const lineCount = other.split('\n').length;
        setNumRows(lineCount < 2 ? 2 : lineCount);
    }, [other]);

    const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');

    const data = {
        FIO: FIO,
        phone: removeNonNumeric(phone),
        typePost: typePost,
        city: city,
        adress: adress,
        oblast: oblast,
        raion: raion,
        postCode: postCode,
        photo: photo,
        other: other,
        price: price,
        firstClass: firstClass,
        ...(phoneUser.length > 1 ? { phoneUser: phoneUser, userId: order.userId, auth:true } : {}),
        adressId: order.adressId, 
        notes: notes,
        codeOutside: codeOutside,
      };

  const SaveData = () =>{
    updateOrder(order.id, data)
    const dataDispatch = {
      FIO: FIO,
      phone: removeNonNumeric(phone),
      typePost: typePost,
      city: city,
      adress: adress,
      oblast: oblast,
      raion: raion,
      postCode: postCode,
      other: other
    }
    dispatch(updateOrderPrivate(order.id, dataDispatch))
    setSelectedOrder(null)
    handleDetailsClick(order.id)
  }

  const DeleteOrder = () => {
    const userConfirmation = window.confirm("Вы уверены, что хотите удалить этот заказ?");
    
    if (userConfirmation) {
      deleteOrder(order.id);
      dispatch(deleteOrderId(order.id));
    }
  };

  const MessageStatus = [
    'Заказ поступил нам. Ожидает проверки сотрудником. В этом статусе вы еще можете менять данные отправления, либо удалить заказ',// новый
    'Заказ проверен сотрудником. Сейчас подготавливаем файлы к печати.',//принят
    'Файлы подготовлены к печати. Заказ в очереди на печать.',// обработан
    'Заказ сейчас находится на стадии печати.',// в печати
    'Печать заказа завершена, и он был аккуратно упакован для безопасной пересылки.',// упакован
    'Ваш заказ был передан на отправку. По штрихкоду можете его отслеживать.',// отправлен
    '' //оплачен
  ]
 

    return(
        <div className="order_details_card">
            <div className="card_container">
                <div className="card">
                <div>
                    <div className='contact_field'>
                    <label>ФИО:</label>
                    <input value={FIO} onChange={(e) => setFIO(e.target.value)} disabled={order.status !== 0 ? true : false}  />
                    </div>
                    <div className='contact_field'>
                    <label>Телефон:</label>
                    <div className='search_bar'>
                        <input
                        style={{marginLeft: -4}}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={order.status !== 0 ? true : false}
                        />
                    </div>
                    </div>
                    <div className='contact_field'>
                    {
                        order.status===0?
                        <select value={typePost} onChange={(e)=>setTypePost(e.target.value)} disabled={order.status !== 0 ? true : false}>
                        <option value={"E"}>Европочта</option>
                        <option value={"R"}>Белпочта</option>
                        </select>:
                        <input
                            style={{flex: 1}}
                            value={typePost==='E'? "Европочта": "Белпочта"}
                            onChange={() => {}}
                            disabled
                        />

                    }
                    
                    <label></label>
                    </div>
                    
                    
                    <div className='contact_field'>
                    <label>Город:</label>
                    <input value={city} onChange={(e)=>setCity(e.target.value)} disabled={order.status !== 0 ? true : false} /> 
                    </div>
                    <div className='contact_field'>
                    <label>
                        {typePost === 'R' ? 'Адрес:' : 'Отделение:'}
                    </label>
                    <input value={adress} onChange={(e)=>setAdress(e.target.value)} disabled={order.status !== 0 ? true : false} /> 
                    </div>
                    
                    {typePost === 'R' ? 
                    <>
                    <div className='contact_field'>
                    <label>Индекс:</label>
                    <input value={postCode} onChange={(e)=>setPostCode(e.target.value)} disabled={order.status !== 0 ? true : false} /> 
                    </div> 
                    
                    </>
                    : null}
                </div>

                <div className="card_actions">
                    {
                    order.status===0?
                    <button className="save_button" onClick={()=>SaveData()}>Сохранить изменения</button>
                    :null
                    }
                    
                </div>
                </div>

                <div className="card">
                    <div>
                    {photo.map((el, index) => <div key={index} className='btn_group'>
                        <button>{el.amount} шт</button>
                        <button>{el.format}</button>
                        <button>{el.type}</button>
                    </div>) }
                        
                    </div>
                    <div className="card_actions">
                        <label>Cумма заказа:</label>
                        <button className='copy_button' style={{backgroundColor: '#b7cbcf', border: '2px solid #a0babf', borderRadius: 5}}>{order.price}р</button>
                        
                    </div>
                </div>

                <div className="card">
                <div>

                    <div className='info_other'>
                    <label>Примечания:</label>
                    <textarea rows={numRows} value={other} onChange={(e)=>setOther(e.target.value)} />
                    </div> 

                    <div className='contact_field' style={{marginTop: 5}}>
                    <label>Статус заказа:</label>
                    <button style={{width: '100%', flex: 2, marginLeft: '2%', backgroundColor: order.status === 5 || order.status === 6 ? '#b7cbcf' : '#cbd36b',
                     border: order.status===5|| order.status === 6 ? '2px solid #a0babf' : '2px solid #b2b77a', borderRadius: 5}}>{StatusOrder[order.status]}</button> 
                    </div>
                    <div className='contact_field'>
                        <label></label>
                        <label style={{flex: 2, fontSize: 11}}>{MessageStatus[order.status]}</label>
                    </div>

                    {
                    order.status===5||6?
                    <div className='contact_field'>
                        <label>Штрихкод:</label>
                        <input style={{marginLeft: 5}} value={codeOutside} onChange={e=>setCodeOutside(e.target.value)} /> 
                    </div>:
                    null}
                    


                </div>
                <div className="card_actions">
                    <label></label>
                    {order.status===0?
                        <button className="delete_button" onClick={()=>DeleteOrder()}>удалить заказ</button>
                        :
                        null
                    }
                </div>
                </div>
            </div>
            </div>
    )
}