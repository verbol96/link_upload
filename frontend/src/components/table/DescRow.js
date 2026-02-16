import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DescRow.css';
import { OneFormat } from './OneFormat';
import { deleteOrder, getSettings, updateOrder } from '../../http/dbApi';
import { useDispatch, useSelector } from 'react-redux';
import { deleteOrderId, updateOrderAction, updateSmsAdd, updateSmsError, updateSmsPay, updateSmsSend } from '../../store/orderReducer';
import _ from 'lodash';
import SearchBar from './SearchBar';
import SearchBarMain from './SearchBarMain';
import {CopyToClipboard} from 'react-copy-to-clipboard'
import { deleteFile } from '../../http/cloudApi';
import { sendSms } from '../../http/authApi';
import { $host } from '../../http';
import style from './DescRow.module.css'
import { Button } from '../../ui/button';
import MyModalComponent from './DialogEP';


export const DescRow = ({ order, setSelectedOrder, handleDetailsClick, isChanged, setIsChanged }) => {
 
  const dispatch = useDispatch()
  const users = useSelector(state=>state.order.users)
  const [price, setPrice] = useState(order.price || '');
  const [price_deliver, setPriceDeliver] = useState(order.price_deliver || '');
  const [typePost, setTypePost] = useState(order.typePost)
  const [FIO, setFIO] = useState(order.FIO || '')
  const [phone, setPhone] = useState(order.phone || '')
  const [city, setCity] = useState(order.city || '')
  const [adress, setAdress] = useState(order.adress || '')
  const [oblast, setOblast] = useState(order.oblast || '')
  const [raion, setRaion] = useState(order.raion || '')
  const [postCode, setPostCode] = useState(order.postCode || '')
  const [firstClass] = useState(order.firstClass || false)
  const [other, setOther] =useState(order.other || '')
  const [photo, setPhoto] = useState(order.photos || [])
  const [phoneUser, setPhoneUser] = useState(order.user?.phone || order.phoneUser || '');
  const [notes, setNotes] = useState(order.notes || '')
  const [codeOutside, setCodeOutside] = useState(order.codeOutside || '')

  const [origin, setOrigin] = useState(order.origin || '');
  const [is_sms_add, setIs_sms_add] = useState(order.is_sms_add || false);
  const [is_sms_send, setIs_sms_send] = useState(order.is_sms_send || false);
  const [is_sms_error, setIs_sms_error] = useState(order.is_sms_error || false);
  const [is_sms_pay, setIs_sms_pay] = useState(order.is_sms_pay || false);
  const [date_sent, setDate_sent] = useState(order.date_sent || '')

  const [numRows, setNumRows] = useState(2);
  const [numRows1, setNumRows1] = useState(2);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Функция для открытия модального окна
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Функция для закрытия модального окна
  const closeModal = () => {
    setIsModalOpen(false);
  };


  const defaultSale = useCallback(() => {
    const count = photo.reduce((sum, photo) => {
      return sum + Number(photo.amount*photo.copies);
    }, 0);
    if(count > 499) return 0.85;
    if(count > 199) return 0.9;
    return 1;
  }, [photo]); 
  
  const [sale, setSale] = useState(defaultSale());
  
  useEffect(() => {
    setSale(defaultSale());
  }, [defaultSale]);  

  useEffect(() => {
    const lineCount = other.split('\n').length;
    setNumRows(lineCount < 2 ? 2 : lineCount+1);
    const lineCount1 = notes.split('\n').length;
    setNumRows1(lineCount1 < 2 ? 2 : lineCount1+1);
  }, [other, notes]);

  const checkChanges = useCallback(() => {
    const initialValues = {
      FIO: order.FIO || '',
      phone: order.phone || '',
      typePost: order.typePost || '',
      city: order.city || '',
      adress: order.adress || '',
      oblast: order.oblast || '',
      raion: order.raion || '',
      postCode: order.postCode || '',
      phoneUser: order.user?.phone || '',
      notes: order.notes || '',
      other: order.other || '',
      codeOutside: order.codeOutside || '',
      photo: order.photos || [],
      firstClass: order.firstClass,
      price: order.price || '',
      price_deliver: order.price_deliver || '',
      origin: order.origin || '',
      date_sent: order.date_sent || ''
    };
    
    const currentValues = {
      FIO,
      phone,
      typePost,
      city,
      adress,
      oblast,
      raion,
      postCode,
      phoneUser,
      notes,
      other,
      codeOutside,
      photo,
      firstClass,
      price,
      price_deliver,
      origin,
      date_sent
    };

    for (const key in initialValues) {
      if (_.isEqual(initialValues[key], currentValues[key]) === false) {
        setIsChanged(true);
        return;
      }
    }

    setIsChanged(false);
  }, [FIO, phone, typePost, city, adress, oblast, raion, postCode, 
      phoneUser, notes, other, codeOutside, setIsChanged, order, photo, firstClass, price, price_deliver, origin, date_sent]);

  useEffect(() => {
    checkChanges();
  }, [checkChanges]);

  const data = {
    FIO: FIO,
    phone: phone,
    typePost: typePost,
    city: city,
    adress: adress,
    oblast: oblast,
    raion: raion,
    postCode: postCode,
    photo: photo,
    other: other,
    price: price,
    price_deliver: price_deliver,
    firstClass: firstClass,
    ...(phoneUser.length > 1 ? { phoneUser: phoneUser, userId: order.userId, auth:true } : {}),
    notes: notes,
    codeOutside: codeOutside,
    origin: origin,
    date_sent: date_sent
  };

  const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');
  
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
      codeOutside: codeOutside,
      notes: notes,
      photos: photo,
      other: other,
      price: price,
      price_deliver: price_deliver,
      firstClass,
      phoneUser: phoneUser,
      user: users.find(user => user.phone === phoneUser) || {FIO:FIO},
      origin: origin,
      date_sent: date_sent
    }

    dispatch(updateOrderAction(order.id, dataDispatch))
    setSelectedOrder(null)
    handleDetailsClick('save')
  }

  const DeleteOrder = async() => {
    const userConfirmation = window.confirm("Вы уверены, что хотите удалить этот заказ?");
    
    if (userConfirmation) {
      await deleteOrder(order.id);
      dispatch(deleteOrderId(order.id));

      const userConfirmation1 = window.confirm("Удалить файлы заказа с сервера?");
      if (userConfirmation1) {
        await deleteFile(order.main_dir_id)
      }
      
    }
  };

  const SmsError = async() =>{
    const userConfirmation = window.confirm(`Отправить смс: "Ошибка в заказе. Подробнее в личном кабинете: www.link1.by"`);
    
    if (userConfirmation) {
      const code = `Ошибка в заказе. Подробнее в личном кабинете: www.link1.by`
      await sendSms(phone, code)
      setIs_sms_error(true)
      dispatch(updateSmsError(order.id))
      updateOrder(order.id, {...data, is_sms_error: true})
    }
  }

  const SmsAdd = async() =>{
    const userConfirmation = window.confirm(`Отправить смс: "Заказ принят. Проверить статус можно в личном кабинете www.link1.by"`);
    
    if (userConfirmation) {
      const code = `Заказ принят. Проверить статус можно в личном кабинете www.link1.by`
      await sendSms(phone, code)
      setIs_sms_add(true)
      dispatch(updateSmsAdd(order.id))
      updateOrder(order.id, {...data, is_sms_add: true})
    }
  }

  const SmsSend = async() =>{
    const userConfirmation = window.confirm(`Отправить смс: "Заказ отправлен. Код посылки: ${codeOutside}. Подробнее: www.link1.by"`);
    
    if (userConfirmation) {
      const code = `Заказ отправлен. Код посылки: ${codeOutside}. Подробнее: www.link1.by`
      await sendSms(phone, code)
      setIs_sms_send(true)
      dispatch(updateSmsSend(order.id))
      updateOrder(order.id, {...data, is_sms_send: true})
    }
  }

  const SmsPay = async () => {
    try {
      // Проверка наличия необходимых данных
      if (!order || typeof order !== 'object') {
        throw new Error('Неверный формат данных заказа');
      }
  
      // Проверка и преобразование цен
      const price = Number(order.price) || 0;
      const priceDeliver = Number(order.price_deliver) || 0;
      
      // Проверка номера заказа
      if (!order.order_number) {
        throw new Error('Отсутствует номер заказа');
      }
  
      // Проверка номера телефона
      if (!phone || typeof phone !== 'string') {
        throw new Error('Неверный формат номера телефона');
      }
  
      // Вычисление суммы с округлением
      const total = (price + priceDeliver).toFixed(2);
      
      // Формирование сообщения
      const code = `Оплата заказа.
  ЕРИП -> E-POS.
  Номер счета: 27307-1-${order.order_number}.
  Сумма: ${total}р`;
  
      // Подтверждение отправки
      const userConfirmation = window.confirm(`Отправить SMS:\n\n${code}`);
      
      if (userConfirmation) {
        // Отправка SMS
        await sendSms(phone, code);
        
        // Обновление состояния
        setIs_sms_pay(true);
        
        // Обновление данных в хранилище
        dispatch(updateSmsPay(order.id));
        
        // Обновление заказа
        await updateOrder(order.id, {...data, is_sms_pay: true});
        
        // Уведомление об успехе
        alert('SMS успешно отправлено');
      }
    } catch (error) {
      console.error('Ошибка при отправке SMS:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };


  const AddFormat = () =>{
    const data = {
        type: "photo",
        format: "а6",
        amount: "1",
        copies: 1,
        paper: 'glossy'
    }
    setPhoto([...photo, data])
  }

  const DeleteFormat = (index) =>{
    setPhoto([...photo.slice(0, index), ...photo.slice(index + 1)])
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


  const SumTeor =()=> {
    const pr = photo.reduce((sum, el)=>{
      return sum+PriceList(el.format)*el.amount*el.copies
  },0 )

  return pr.toFixed(2)
  }

  const showFIO = () =>{
    const pretend = users.find(user => user.phone === phoneUser)
    if(pretend){
      return pretend.FIO
    }else return ''
  }

  const isUser = () =>{
    const pretend = users.find(user => user.phone === phoneUser)
    if(pretend){
        return pretend.role  === 'USER'
    }else return false
    
  }

  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleMain, setModalVisibleMain] = useState(false);

  const handleModalMouseEnter = () => {
    setModalVisible(true);
  };
  
  const handleModalMouseLeave = () => {
    setModalVisible(false);
  };
  const handleModalMouseEnterMain = () => {
    setModalVisibleMain(true);
  };
  
  const handleModalMouseLeaveMain = () => {
    setModalVisibleMain(false);
  };

  const [listOps, setListObs] = useState([])
  useEffect(()=>{
      const getListOps = async () => {
          try {
            const {data} = await $host.get('/api/ep/getListOps');
            setListObs(data.Table)
          } catch (error) {
            console.error('Ошибка при получении JWT:', error);
          }
        };

      getListOps()
  },[])

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef  = useRef(null)
  const [inputOPS, setInputOPS] = useState('')
  const [nameOPS, setNameOPS] = useState('Выберете отделение')

  useEffect(()=>{
        if (isOpen) {
            // Если dropdown открыт, устанавливаем фокус на input
            inputRef.current.focus();
          }
    }, [isOpen])
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const filterOPS = listOps.filter(el => {
    return el.WarehouseName && el.WarehouseName.toLowerCase().includes(inputOPS.toLowerCase());
    });

  const putNameOPS =(name)=>{
    setNameOPS(name)
    setIsOpen(false)
  }

  const phoneWithoutPlus = () =>{
      const newPhone = phone.replace('+', '');
      return newPhone
  }

  const nameSplit = (i) =>{
      const splitResalt = FIO.split(' ')
      return splitResalt[i]
  }

  const sendOrderEp = async() =>{
    const sendConfirmation = window.confirm('sum = '+price + '\nOPS = '+nameOPS.WarehouseId + '\nphone = '+ phoneWithoutPlus() + '\nname1 = '+nameSplit(0) + '\nname2 = '+nameSplit(1));
    
    if (sendConfirmation) {

        const dataSend = {sum: price, OPS: nameOPS.WarehouseId, phone: phoneWithoutPlus(), name1: nameSplit(0), name2: nameSplit(1)}
        
        try {
          const {data} = await $host.post('/api/ep/sendOrder', dataSend);
          setCodeOutside(data.Table[0].Number)
        } catch (error) {
          console.error('Ошибка:', error);
        }
      

    }
     
  }

  const checkOrderEp = async() =>{

    if(!codeOutside) {
      window.alert('нету штрихкода')
      return;
    }

    openModal()
      
  }

  const handlePrint = () =>{
        
    const printContent = `
        <div style=" margin-top:180px; font-size: 32px; transform: rotate(90deg); ">
            <div style="display: flex; flex-direction: row; border-bottom: 1px solid black; height: 74px">
                <div style="flex: 1;font-size: 25px; margin: auto">кому: </div>
                <div style="flex: 6; text-align: center; margin: auto;  font-family: 'Roboto Mono', monospace;">${order.FIO}</div>
            </div>

            <div style="display: flex; flex-direction: row; border-bottom: 1px solid black; height: 74px"> </div>

            <div style="display: flex; flex-direction: row; border-bottom: 1px solid black; height: 74px">
                <div style="flex: 1;font-size: 25px; margin: auto">куда: </div>
                <div style="flex: 6; text-align: center; margin: auto;  font-family: 'Roboto Mono', monospace;">${order.adress}</div>
            </div>

            <div style="display: flex; flex-direction: row; border-bottom: 1px solid black; height: 74px">
                <div style="flex: 1; border-left: 1px solid black;border-right: 1px solid black; font-size: 40px ; text-align: center; padding-top: 10px; font-family: 'Roboto Mono', monospace; ">${order.postCode} </div>
                <div style="flex: 3; text-align: center;  margin: auto;  font-family: 'Roboto Mono', monospace;">${order.city}</div>
            </div>

            <div style="display: flex; flex-direction: row; border-bottom: 1px solid black; height: 74px">
                <div style=" margin: auto;  font-family: 'Roboto Mono', monospace;">${order.raion}</div>
            </div>

            <div style="display: flex; flex-direction: row; ; border-bottom: 1px solid black; height: 74px">
                <div style="flex: 1; text-align: center; margin: auto;   font-family: 'Roboto Mono', monospace;">${order.oblast}</div>
            </div>

            <div style="display: flex; flex-direction: row;  height: 74px">
                <div style="flex: 1;font-size: 25px; margin: auto">телефон: </div>
                <div style="flex: 1; text-align: center; margin: auto;  font-family: 'Roboto Mono', monospace;;">${order.phone}</div>
            </div>
        </div>`;

    ;
    const printWindow = window.open('', '', 'height=800px,width=600px');
    printWindow.document.write(printContent);
    printWindow.onafterprint = function() {
        printWindow.close();
    };
    printWindow.print();
}


const ShowBtnSms = (smsType, fanc, text) =>{
  return(
      smsType ? 
      (
        <Button className='flex-1' variant='outline' disabled>
          <i style={{ color: 'gray' }} className="bi bi-check-all"></i> {text}
        </Button>
      ) : (
        <Button className='flex-1' variant='secondary' onClick={fanc}>
          <i style={{ color: 'white', marginRight: 10 }} className="bi bi-telephone-forward"></i> {text}
        </Button>
      )
  )
}

const AddInvoices = async () => {
  // Приводим к числу и устанавливаем 0, если значение невалидно
  const price = Number(order.price) || 0;
  const priceDeliver = Number(order.price_deliver) || 0;

  // Вычисляем сумму и округляем
  const totalAmount = (price + priceDeliver).toFixed(2);

  const sendConfirmation = window.confirm(
    `Подтвердите:\n` +
    `Номер заказа: ${order.order_number}\n` +
    `Цена: ${totalAmount}р\n` +
    `Info: Заказ ${order.FIO}`
  );
    
  if (sendConfirmation) {
    const dataInvoices = {
      AccountNo: order.order_number,
      Amount: totalAmount,  // Уже строка с 2 знаками после запятой
      Info: `Заказ ${order.FIO}`
    };

    try {
      const { data } = await $host.post('/api/ep/addInvoicesPay', dataInvoices);
      if (data) {
        setOther(prev => `Данные для оплаты: 
          ЕРИП -> E-POS 
          номер счета: 27307-1-${order.order_number} \n \n` + prev);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось создать счет. Попробуйте еще раз.'); // Уведомление пользователя
    }
  }
};

const CancelInvoices = async() =>{

  const info = window.confirm( 'Отменить счет?' );
    
  if (info) {
      try {
        const dataAPI = {
          InvoiceNo : order.order_number 
        }
        const {data} = await $host.post('/api/ep/delInvoicesPay', dataAPI);
        console.log(data)
        if(data) window.alert( 'отменен!' )
      } catch (error) {
        console.error('Ошибка:', error);
      }

  }
}

const CheckInvoices = async() =>{

      try {
        const {data} = await $host.post('/api/ep/getInvoicesPay', {No: order.order_number });
        const descStatus = {
          '1':'Ожидает оплату',
          '2':'Просрочен',
          '3':'Оплачен',
          '4':'Оплачен частично',
          '5':'Отменен',
          '6':'Оплачен с помощью банковской карты',
          '7': 'Платеж возращен'
        }
        console.log(data)
        const status = data.Status
        window.alert(descStatus[status]);
      } catch (error) {
        console.error('Ошибка:', error);
        window.alert('счет не найдет');
      }

  }

const [countOrders, setCountOrders] = useState(0);

useEffect(() => {
  const fetchCount = async () => {
    const { data } = await $host.get(`/api/order/countOrders/${order.userId}`);
    setCountOrders(data);
  };
  fetchCount();
}, []);





  return (
    <div className="order_details_card">
      {isModalOpen && <MyModalComponent isOpen={isModalOpen} closeModal={closeModal} codeOutside={codeOutside} />}
      
      <div className="card_container_admin">
        <div className="card_admin">
          <div>
            <div className='contact_field'>
              <CopyToClipboard text={FIO}>
              <label>ФИО:</label>
              </CopyToClipboard>
              <input  style={{marginLeft: 5}} value={FIO} onChange={(e) => setFIO(e.target.value)} />
            </div>
            <div className='contact_field'>
              <CopyToClipboard text={phone}>
              <label>Телефон:</label>
              </CopyToClipboard>
              <div className='search_bar'
                onMouseEnter={handleModalMouseEnterMain}
                onMouseLeave={handleModalMouseLeaveMain}
              >
                <input
                  style={{}}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <SearchBarMain phone={phone} modalVisibleMain={modalVisibleMain} setModalVisibleMain={setModalVisibleMain} users={users}
                          setFIO={setFIO} setTypePost={setTypePost} setCity={setCity} setPhone={setPhone}
                          setAdress={setAdress} setPostCode={setPostCode} setRaion={setRaion} setOblast={setOblast} />
              </div>
            </div>
            <div className='contact_field'>
              
              <select value={typePost} onChange={(e)=>setTypePost(e.target.value)}>
                  <option value={"E"}>Европочта(наложенный)</option>
                  <option value={"E1"}>Европочта(ЕРИП)</option>
                  <option value={"R"}>Белпочта(наложенный)</option> 
                  <option value={"R2"}>Белпочта(ЕРИП)</option> 
                  <option value={"R1"}>Письмо(ЕРИП)</option> 
              </select>
              <label></label>
            </div>
          
            
            <div className='contact_field'>
              <CopyToClipboard text={city}>
              <label>Город:</label>
              </CopyToClipboard>
              <input value={city} onChange={(e)=>setCity(e.target.value)} /> 
            </div>
            <div className='contact_field'>
              <CopyToClipboard text={adress}>
              <label>
                {typePost === 'R' || typePost === 'R1' ? 'Адрес:' : 'Отделение:'}
              </label>
              </CopyToClipboard>
              <input value={adress} onChange={(e)=>setAdress(e.target.value)} /> 
            </div>

            {(typePost === 'E' || typePost === 'E1') && 
                <div className=' mt-3'>
                <div className={style.inputBlock} ref={dropdownRef}>
                  <button onClick={() => setIsOpen(!isOpen)}>{nameOPS.WarehouseName}</button>
                  {isOpen && (
                      <div className={style.inputBlockDetails}>
                      <input ref={inputRef} value={inputOPS} onChange={(e)=>setInputOPS(e.target.value)} />
                  
                      {filterOPS.map((el,index)=><div key={index} onClick={()=>putNameOPS(el)}>
                          {el.WarehouseName}
                      </div>)}
                  
                      </div>
                  )}
                </div>
                <div className='flex justify-around mt-1'>
                  <Button variant='secondary' onClick={()=>{checkOrderEp()}}>проверить</Button>
                  <Button variant='secondary' onClick={()=>{sendOrderEp()}}>Оформить заявку</Button>
                </div>
                
                </div>
              }
            
            {typePost === 'R' || typePost === 'R1' ? 
            <>
            <div className='contact_field'>
              <CopyToClipboard text={postCode}>
              <label>Индекс:</label>
              </CopyToClipboard>
              <input value={postCode} onChange={(e)=>setPostCode(e.target.value)} /> 
            </div> 
            <div className='contact_field'>
              <CopyToClipboard text={raion}>
              <label>Район:</label>
              </CopyToClipboard>
              <input value={raion} onChange={(e)=>setRaion(e.target.value)} /> 
            </div> 
            <div className='contact_field'>
              <CopyToClipboard text={oblast}>
              <label>Область:</label>
              </CopyToClipboard>
              <input value={oblast} onChange={(e)=>setOblast(e.target.value)} /> 
            </div> 
            </>
            : null}
              {(typePost==='R' || typePost==='R1') &&
                <div className='flex justify-end mt-2'>
                <Button variant='secondary' onClick={()=>{handlePrint()}}><i style={{color: 'white', marginRight: 10}} className="bi bi-printer"></i> печать </Button>
                </div>
              }
          </div>

          <div className="card_actions">
            <button className="save_button" onClick={()=>SaveData()}  style={{ backgroundColor: isChanged ? '#dbcc00' : '' }}>Сохранить</button>
          </div>
        </div>

        <div className="card_admin">
          <div>
          {photo.map((el, index) => <OneFormat index={index} setPhoto={setPhoto} photo={photo} el={el} key={index} DeleteFormat={DeleteFormat} />) }
              <button type="button" onClick={()=>{AddFormat()}}>добавить</button>
            </div>
          <div className="card_actions">
            <button className='copy_button'  onClick={()=>{setPrice((SumTeor()*sale).toFixed(2))}}>{SumTeor()}р</button>
            <div  style={{transform: 'scale(0.85)'}}>
            <select style={{appearance: 'none', padding: '0px 10px'}}
                    value={sale}
                    onChange={(e)=>setSale(e.target.value)}>
              <option value={1}>0%</option>
              <option value={0.9}>10%</option>
              <option value={0.85}>15%</option>
              <option value={0.8}>20%</option>
            </select>
            </div>
            <input
              className='price_input'
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <input
              className='price_input'
              style={{width: '20%', height: '75%', marginLeft: 2}}
              type="text"
              value={price_deliver}
              onChange={(e) => setPriceDeliver(e.target.value)}
            />
          </div>
          
        </div>

        <div className="card_admin">
          <div>
           <div className='origin'>
              <label>Источник:</label>
              <select value={origin} onChange={(e)=>setOrigin(e.target.value)}>
                  <option value={'website'}>website</option>
                  <option value={'telegram'}>telegram</option>
                  <option value={'email'}>email</option>
              </select>
            </div>
            <div className='origin'>
              <label>Отправка ожидается:</label>
              <input className='inputData' type='date' value={date_sent} onChange={(e)=>setDate_sent(e.target.value)} />
            </div>
            <div className='info_other'>
              <label>Заметки:</label>
              <textarea rows={numRows1}  value={notes} onChange={(e)=>setNotes(e.target.value)}  />
            </div>
 
            <div className='info_other'>
              <label>Примечания клиента:</label>
              <textarea rows={numRows} value={other} onChange={(e)=>setOther(e.target.value)} />
            </div>

            <div className='contact_field'>
              <label onClick={()=>setPhoneUser(phone)}>Владелец ({countOrders}):</label>
              <div className='search_bar'
                  onMouseEnter={handleModalMouseEnter}
                  onMouseLeave={handleModalMouseLeave}
              >
                  <input value={phoneUser} onChange={e=>setPhoneUser(e.target.value)} /> 
                  <SearchBar  users={users} modalVisible={modalVisible} setModalVisible={setModalVisible}  phoneUser={phoneUser} setPhoneUser={setPhoneUser} />
              </div>
              
            </div>
            <div className='contact_field'>
              <label></label>
              <label style={{fontSize: 12, flex: 2, color: !isUser() && 'red'}}>{showFIO()}</label>
            </div>
            <div className='contact_field'>
              <label>Штрихкод:</label>
              <input style={{marginLeft: 5}} value={codeOutside} onChange={e=>setCodeOutside(e.target.value)} /> 
            </div>

          </div>
          <div className="gap-1 flex justify-start">

            { order.status === 0 && ShowBtnSms(is_sms_error, SmsError, 'ошибка')}
            { order.status !== 0 && ShowBtnSms(is_sms_add, SmsAdd, 'принят') }
            { order.status !== 0 && ShowBtnSms(is_sms_send, SmsSend, 'отправлен')}
            { (order.typePost === 'R1' || order.typePost === 'E1') && ShowBtnSms(is_sms_pay, SmsPay, 'оплата') }
            
          </div>

          <div className='flex justify-end mt-3 gap-1' >
            { (order.typePost === 'R1' || order.typePost === 'E1') && <>
              <Button  variant='outline' size='sm' onClick={()=>AddInvoices()}>выставить счет</Button>
              <Button  variant='outline' size='sm' onClick={()=>CancelInvoices()}>отменить счет</Button>
              <Button  variant='outline' size='sm' onClick={()=>CheckInvoices()}>проверить счет</Button>
              </>
            }
          </div>

          <div className='flex justify-end mt-3 gap-1' >
            <Button className='w-[25%]' variant='destructive' size='sm' onClick={()=>DeleteOrder()}>удалить</Button>
          </div>

        
        </div>
      </div>
    </div>
  );
};