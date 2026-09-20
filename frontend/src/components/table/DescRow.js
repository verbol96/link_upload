import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './DescRow.css';
import { OneFormat } from './OneFormat';
import { deleteOrder, getSettings, updateOrder } from '../../http/dbApi';
import { useDispatch, useSelector } from 'react-redux';
import { deleteOrderId, updateOrderAction, updateSmsAdd, updateSmsError, updateSmsPay, updateSmsSend } from '../../store/orderReducer';
import _ from 'lodash';
import SearchBar from './SearchBar';
import SearchBarMain from './SearchBarMain';
import { deleteFile} from '../../http/cloudApi';
import { sendSms } from '../../http/authApi';
import { $host } from '../../http';
import style from './DescRow.module.css'
import { Button } from '../../ui/button';
import MyModalComponent from './DialogEP';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { toast } from 'sonner';


export const DescRow = ({ orders, order, setSelectedOrder, handleDetailsClick, isChanged, setIsChanged }) => {

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

  const [origin] = useState(order.origin || '');
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
      phoneUser, notes, other, codeOutside, setIsChanged, order, photo, price, price_deliver, origin, date_sent]);

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

      if(order.origin === 'website'){
        const userConfirmation1 = window.confirm("Удалить файлы заказа с сервера?");
        if (userConfirmation1) {
          await deleteFile(order.main_dir_id)
        }
      }
      
      
    }
  };

  const SmsError = async() =>{
    const userConfirmation = window.confirm(`Отправить смс: "Ошибка в заказе. Подробнее в личном кабинете: www.link1.by"`);
    
    if (userConfirmation) {
      const code = `Ошибка в заказе. Подробнее в личном кабинете: www.link1.by`
      await sendSms(phone, code)
      setPrice(0)
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
    const price = Number(order.price) || 0;
    const priceDeliver = Number(order.price_deliver) || 0;
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
            Amount: totalAmount,
            Info: `Заказ ${order.FIO}`,
        };

        try {
            const { data } = await $host.post('/api/ep/addInvoicesPay', dataInvoices);

            if (data) {
                // Обновляем Redux — синхронизируем с бэком
                dispatch(updateOrderAction(order.id, {
                    ...order,
                    isPayment: 'wait',
                }));

                toast.success('Счёт выставлен');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            toast.error('Не удалось создать счёт', {
                description: 'Попробуйте ещё раз',
            });
        }
    }
};

const CancelInvoices = async () => {
    const info = window.confirm('Отменить счёт?');

    if (info) {
        try {
            const dataAPI = {
                InvoiceNo: order.order_number,
            };

            const { data } = await $host.post('/api/ep/delInvoicesPay', dataAPI);

            if (data) {
                // Обновляем Redux — синхронизируем с бэком
                dispatch(updateOrderAction(order.id, {
                    ...order,
                    isPayment: 'none',
                }));

                toast.success('Счёт отменён');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            toast.error('Не удалось отменить счёт');
        }
    }
};


const CheckInvoices = async () => {
    try {
        const { data } = await $host.post('/api/ep/getInvoicesPay', {
            No: order.order_number,
        });

        const descStatus = {
            '1': 'Ожидает оплату',
            '2': 'Просрочен',
            '3': 'Оплачен',
            '4': 'Оплачен частично',
            '5': 'Отменён',
            '6': 'Оплачен банковской картой',
            '7': 'Платёж возвращён',
        };

        const status = String(data.Status);
        const statusText = descStatus[status] || 'Неизвестный статус';

        // ===== Оплачен =====
        if (status === '3' || status === '6') {
            if (order.isPayment === 'paid') {
                toast.info(`Статус: ${statusText}`);
                return;
            }

            await updateOrder(order.id, {
                ...order,
                isPayment: 'paid',
            });

            toast.success('Заказ оплачен', { description: statusText });
            return;
        }

        // ===== Другие статусы =====
        toast.info(`Статус: ${statusText}`);

    } catch (error) {
        console.error('Ошибка:', error);
        toast.error('Счёт не найден', {
            description: 'Проверьте номер заказа',
        });
    }
};

const [isOpen1, setIsOpen1] = useState(false)
const [ordersModal, setOrdersModal] = useState([])

const openModalOrders = async() =>{
  
  const {data} = await $host.get(`/api/order/ordersUser/${order.userId}`)
  setOrdersModal(data)
  setIsOpen1(true)
}

const photoLine = (data) =>{
      return data.reduce((sum, el)=>{
        if(el.paper==='lustre'){
            return sum+el.amount*el.copies+"шт("+el.format+")ЛЮСТР "
        }else{
            return sum+el.amount*el.copies+"шт("+el.format+") "
        }
    }, '')
}

const regions = [
  'Брестская область', 'Витебская область', 'Гомельская область', 
  'Гродненская область', 'Минская область', 'Могилёвская область'
];

const [aboutUser, setAboutUser] = useState(order.user.aboutUser || '');
const [smsText, setSmsText] = useState('');

const saveAboutUser = async () => {
  try {
    await $host.put(`/api/order/changeAboutUser/${order.userId}`, { aboutUser });
    alert('Сохранено'); 
  } catch (error) {
    console.error(error);
    alert('Ошибка сохранения');
  }
};

const sendSmsNew = async () => {
  if (!smsText.trim()) {
    alert('Введите текст SMS');
    return;
  }
  try {
    const userConfirmation = window.confirm(`Отправить смс?`);
    
    if (userConfirmation) {
      await sendSms(order.user.phone, smsText)
      alert('смс успешно отправлено');
    }
    setSmsText('');
  } catch (error) {
    console.error(error);
    alert('Ошибка отправки');
  }
};

    const duplicateOrders = useMemo(() => {
        const ACTIVE_STATUSES = [0, 1, 2, 3, 4, 7, 8];
        const pretend = orders.filter(el => ACTIVE_STATUSES.includes(el.status));
        const samePhone = pretend.filter(el => el.phone === order.phone);
        return samePhone
            .filter(el => el.id !== order.id)
            .map(el => ({
                id: el.id,
                order_number: el.order_number,
            }));
    }, [orders, order.phone, order.id]);


    const toJoinOrder = async (duplicateId) => {
        const second = orders.find(o => o.id === duplicateId);
        if (!second) return;

        // ====== ПОДТВЕРЖДЕНИЕ ======
        const confirmed = window.confirm(
            `Объединить заказ №${order.order_number} с заказом №${second.order_number}?\n\n` +
            `Фото и примечания из заказа №${second.order_number} перейдут в текущий.\n` +
            `Заказ №${second.order_number} будет удалён.\n\n` +
            `Продолжить?`
        );
        if (!confirmed) return;

        // ====== СКЛЕИВАЕМ OTHER ======
        let mergedOther = other || '';
        if (second.other) {
            mergedOther = mergedOther
                ? `${mergedOther}\n(№${second.order_number}) ${second.other}`
                : `(№${second.order_number}) ${second.other}`;
        }

        // ====== СУММИРУЕМ PRICE ======
        const mergedPrice = (
            Number(price || 0) + Number(second.price || 0)
        ).toFixed(2);

        const data = {
            id: order.id,
            idJoin: duplicateId,
            other: mergedOther,
            price: mergedPrice,
        };

        try {
            const response = await $host.put('/api/order/toJoinOrder', data);
            const updatedOrder = response.data;

            // ====== ОБНОВЛЯЕМ ФОРМУ ======
            setOther(updatedOrder.other ?? mergedOther);
            setPrice(updatedOrder.price ?? mergedPrice);
            setPhoto(updatedOrder.photos || updatedOrder.photo || []);

            // ====== УДАЛЯЕМ ВТОРОЙ ЗАКАЗ ИЗ СПИСКА ======
            dispatch(deleteOrderId(duplicateId));

            // ====== ТОСТ УСПЕХА ======
            toast.success('Заказы объединены', {
                description: `Заказ №${second.order_number} → №${order.order_number}`,
                duration: 4000,
            });

        } catch (err) {
            console.error('Ошибка объединения:', err);
            console.error('Status:', err.response?.status);
            console.error('Data:', err.response?.data);

            // ====== ТОСТ ОШИБКИ ======
            toast.error('Не удалось объединить заказы', {
                description: err.response?.data?.error || 'Попробуйте ещё раз',
            });
        }
    };

   
  return (
    <>
    <Dialog open={isOpen1} onOpenChange={setIsOpen1}>
      <DialogContent 
       onOpenAutoFocus={(e) => e.preventDefault()}
        aria-describedby={undefined} 
        className="max-w-[80vw] max-h-[90vh] w-[80vw] h-[90vh] p-3"
        style={{ maxWidth: '90vw', maxHeight: '90vh' }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base">
            Все заказы от{' '}
            <span className="text-teal-700 font-bold text-xl">
              {order.user.FIO} {' '}
            </span>
            ({order.user.phone})
          </DialogTitle>
         <DialogDescription className='h-full overflow-hidden' asChild>
          <div>
              <div className='flex h-[calc(100%-50px)] flex-col justify-between gap-10'>
                <div className="flex-[3] max-h-[400px] overflow-auto mt-4 ">
                                <table className="w-full text-sm">
                                  <thead className="sticky top-0 bg-gray-50">
                                    <tr className="border-b">
                                      <th className="text-left py-2">Дата</th>
                                      <th className="text-left py-2">ФИО</th>
                                      <th className="text-left py-2">Город</th>
                                      <th className="text-left py-2">Адрес</th>
                                      <th className="text-left py-2">Тип</th>
                                      <th className="text-left py-2">Заказ</th>
                                      <th className="text-left py-2">Сумма</th>
                                      <th className="text-left py-2">Источник</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ordersModal.map((el) => (
                                      <tr key={el.order_number} className="border-b hover:bg-gray-50">
                                        <td className="py-2">
                                          {new Date(el.createdAt).toLocaleDateString('ru-RU')}
                                        </td>
                                        <td className="py-2 px-2">
                                          <div className="truncate block max-w-[200px]" title={el.FIO}>
                                            {el.FIO}
                                          </div>
                                        </td>
                                        <td className="py-2">{el.city}</td>
                                        <td className="py-2 px-2">
                                          <div className="truncate block max-w-[200px]" title={el.adress}>
                                            {el.adress}
                                          </div>
                                        </td>
                                        <td className="py-2">{el.typePost}</td>
                                        <td className="py-2 px-2">
                                          <div className="truncate block max-w-[200px]" title={photoLine(el.photos)}>
                                            {photoLine(el.photos)}
                                          </div>
                                        </td>
                                        <td className="py-2">{el.price}</td>
                                        <td className="py-2 pl-2">{el.origin}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                </div>

                <div className='flex-[2] flex flex-row justify-between gap-10 '>
                  {/* Поле "О клиенте" */}
                  <div className="flex-1 flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">О клиенте</label>
                    <textarea
                      value={aboutUser}
                      onChange={(e) => setAboutUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                      rows={3}
                      placeholder="Дополнительная информация о клиенте..."
                    />
                    <div className="flex justify-center">
                      <button
                        onClick={saveAboutUser}
                        className={`px-4 py-2 ${order.user.aboutUser === aboutUser ? 'bg-gray-500' : 'bg-green-700'} text-white rounded-lg text-sm transition`}
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>

                  {/* Поле для SMS */}
                  <div className="flex-1 flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Текст SMS</label>
                    <textarea
                      value={smsText}
                      onChange={(e) => setSmsText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                      rows={2}
                      placeholder="Введите текст SMS..."
                    />
                    <div className="flex justify-center">
                      <button
                        onClick={sendSmsNew}
                        className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm  transition"
                      >
                        Отправить SMS
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              

              {/* Нижняя часть — фиксирована */}
              <div className='h-[50px] mt-4 flex flex-row justify-end gap-3 text-teal-800 '>
                <label>Всего заказов: {order.user.orderCount} шт</label>
                <label>Сумма заказов: {order.user.totalOrderSum} р</label>
              </div>
           </div>
          </DialogDescription>
        </DialogHeader>
        
        
       
      </DialogContent>
    </Dialog>

    <div className="order_details_card">
      {isModalOpen && <MyModalComponent isOpen={isModalOpen} closeModal={closeModal} codeOutside={codeOutside} />}
      
      <div className="card_container_admin">
        <div className="card_admin">
          <div>
            <div className='contact_field'>
              <label>ФИО:</label>
              <input  style={{marginLeft: 5}} value={FIO} onChange={(e) => setFIO(e.target.value)} />
            </div>
            <div className='contact_field'>
              <label>Телефон:</label>
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
              <label>Город:</label>
              <input value={city} onChange={(e)=>setCity(e.target.value)} /> 
            </div>
            <div className='contact_field'>
              <label>
                {typePost === 'R' || typePost === 'R1' || typePost === 'R2' ? 'Адрес:' : 'Отделение:'}
              </label>
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
            
            {typePost === 'R' || typePost === 'R1' || typePost === 'R2'? 
            <>
            <div className='contact_field'>
              <label>Индекс:</label>
              <input value={postCode} onChange={(e)=>setPostCode(e.target.value)} /> 
            </div> 
            <div className='contact_field'>
              <label>Район:</label>
              <input value={raion} onChange={(e)=>setRaion(e.target.value)} /> 
            </div> 
            <div className='contact_field'>
              <label style={{flex:1}}>Область:</label>
              <select 
                style={{appearance: 'none', padding: '0px 10px', margin: '0px', flex: 2}}
                value={oblast} 
                onChange={(e) => setOblast(e.target.value)}
                >
                <option value=""></option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            </>
            : null}
              {(typePost==='R' || typePost==='R1' || typePost==='R2') &&
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
            {/* для обьеденения*/}
            {duplicateOrders.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-1 mb-8">
                    {duplicateOrders.map((el) => (
                        <button
                            key={el.id}
                            onClick={() => toJoinOrder(el.id)}
                            className="group inline-flex items-center gap-1.5
                                    px-2.5 py-1 rounded-md
                                    bg-stone-50 border border-stone-200
                                    text-[12px] font-medium text-stone-700
                                    transition-all
                                    hover:bg-[#2C3531] hover:border-[#2C3531] hover:text-white
                                    active:scale-95"
                            title={`Объединить с заказом №${el.order_number}`}
                        >
                            <i className="bi bi-plus-circle text-[11px] opacity-70 group-hover:opacity-100" />
                            №{el.order_number}
                        </button>
                    ))}
                </div>
            )}
          { photo.map((el, index) => <OneFormat index={index} setPhoto={setPhoto} photo={photo} 
                            el={el} key={index} DeleteFormat={DeleteFormat}  />) }
              <button style={{marginLeft: '50px', marginTop: '10px'}} type="button" onClick={()=>{AddFormat()}}>добавить</button>
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

            

            <div className='contact_field mt-2'>
              <label onClick={()=>setPhoneUser(phone)}>Владелец:</label>
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
            <div  style={{fontSize: 10}} className='contact_field mt-2'>
              <label>О клиенте:</label>
              <label 
                className="flex-3 whitespace-pre-wrap text-left"
                style={{flex: 2}}
              >
                {users.find(user => user.phone === phoneUser)?.aboutUser || "Нет заметок"}
              </label>
            </div>
            <div className='contact_field'>
              <label>Штрихкод:</label>
              <input style={{marginLeft: 5}} value={codeOutside} onChange={e=>setCodeOutside(e.target.value)} /> 
            </div>
           
            <div className='flex flex-row justify-center gap-3 text-xs font-thin mt-3'>
              <label className=''> Всего заказов: {order.user.orderCount} шт</label>
              <label className=''>Сумма заказов: {order.user.totalOrderSum} р</label>
              <button onClick={()=>openModalOrders()} className='px-3 py-0 bg-gray-200 text-gray-800 rounded hover:bg-gray-300'>открыть</button>
            </div>
              
           
            

          </div>
          
          {/* === СМС — только для USER === */}
          {order.user?.role === 'USER' && (
              [0, 8].includes(order.status) ? (
                  <div className="gap-1 flex justify-start">
                      {ShowBtnSms(is_sms_error, SmsError, 'ошибка')}
                  </div>
              ) : (
                  <div className="relative mt-4 pt-1">

                      {/* Подпись «СМС» на рамке */}
                      <span className="absolute -top-2 left-3 px-1.5 bg-white
                                      text-[10px] uppercase tracking-wider font-semibold
                                      text-stone-400 select-none">
                          Смс
                      </span>

                      {/* Внутренний блок с рамкой */}
                      <div className="flex items-center gap-1.5 px-3 py-2
                                      border border-stone-200 rounded-lg
                                      whitespace-nowrap">

                          {ShowBtnSms(is_sms_add, SmsAdd, 'принят')}
                          {ShowBtnSms(is_sms_send, SmsSend, 'отправлен')}
                          {(order.typePost === 'R1' || order.typePost === 'E1' || order.typePost === 'R2') &&
                              ShowBtnSms(is_sms_pay, SmsPay, 'оплата')}

                      </div>
                  </div>
              )
          )}

          {/* === Блок оплаты — для всех типов ЕРИП, вне зависимости от роли === */}
          {(order.typePost === 'R1' || order.typePost === 'E1' || order.typePost === 'R2') &&
          [1, 2, 3, 4, 5, 7].includes(Number(order.status)) && (
              <div className="relative mt-4 pt-1">

                  {/* Подпись «ОПЛАТА» на рамке */}
                  <span className="absolute -top-2 left-3 px-1.5 bg-white
                                  text-[10px] uppercase tracking-wider font-semibold
                                  text-stone-400 select-none">
                      Оплата
                  </span>

                  {/* Внутренний блок с рамкой */}
                  <div className="flex items-center gap-1.5 px-3 py-2
                                  border border-stone-200 rounded-lg
                                  whitespace-nowrap">

                      {/* Статус оплаты — 3 варианта */}
                      {order.isPayment === 'paid' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                                          text-[12px] font-medium whitespace-nowrap
                                          bg-green-50 text-green-700 border border-green-200">
                              <i className="bi bi-check-circle-fill text-[11px]" />
                              Оплачен
                          </div>
                      )}

                      {order.isPayment === 'wait' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                                          text-[12px] font-medium whitespace-nowrap
                                          bg-amber-50 text-amber-700 border border-amber-200">
                              <i className="bi bi-clock-fill text-[11px]" />
                              Ожидает оплаты
                          </div>
                      )}

                      {order.isPayment === 'none' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                                          text-[12px] font-medium whitespace-nowrap
                                          bg-stone-50 text-stone-500 border border-stone-200">
                              <i className="bi bi-dash-circle text-[11px]" />
                              Счёт не выставлен
                          </div>
                      )}

                      {/* Кнопки — в зависимости от состояния */}
                      {order.isPayment === 'none' && (
                          <Button variant='outline' size='sm' onClick={() => AddInvoices()}>
                              <i className="bi bi-receipt text-[12px] mr-1" />
                              Выставить счёт
                          </Button>
                      )}

                      {order.isPayment === 'wait' && (
                          <>
                              <Button variant='outline' size='sm' onClick={() => CancelInvoices()}>
                                  <i className="bi bi-x-circle text-[12px] mr-1" />
                                  отменить
                              </Button>
                              <Button variant='outline' size='sm' onClick={() => CheckInvoices()}>
                                  <i className="bi bi-arrow-clockwise text-[12px] mr-1" />
                                  проверить
                              </Button>
                          </>
                      )}

                      {order.isPayment === 'paid' && (
                          <Button variant='outline' size='sm' onClick={() => CheckInvoices()}>
                              <i className="bi bi-arrow-clockwise text-[12px] mr-1" />
                              проверить
                          </Button>
                      )}
                  </div>
              </div>
          )}

          <div className='flex justify-end mt-3 gap-1' >
            <Button className='w-[25%]' variant='destructive' size='sm' onClick={()=>DeleteOrder()}>удалить</Button>
          </div>

        
        </div>
      </div>
    </div>
    </>
  );
};