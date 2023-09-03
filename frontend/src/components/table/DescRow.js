import React, { useState, useEffect, useCallback } from 'react';
import './DescRow.css';
import { OneFormat } from './OneFormat';
import { deleteOrder, getSettings, updateOrder } from '../../http/dbApi';
import { useDispatch, useSelector } from 'react-redux';
import { deleteOrderId, updateOrderAction } from '../../store/orderReducer';
import _ from 'lodash';
import SearchBar from './SearchBar';
import SearchBarMain from './SearchBarMain';
import {CopyToClipboard} from 'react-copy-to-clipboard'

export const DescRow = ({ order, setSelectedOrder, handleDetailsClick }) => {

  const dispatch = useDispatch()
  const users = useSelector(state=>state.order.users)
 
  const [price, setPrice] = useState(order.price || '');
  const [typePost, setTypePost] = useState(order.typePost)
  const [FIO, setFIO] = useState(order.FIO || '')
  const [phone, setPhone] = useState(order.phone || '')
  const [city, setCity] = useState(order.city || '')
  const [adress, setAdress] = useState(order.adress || '')
  const [oblast, setOblast] = useState(order.oblast || '')
  const [raion, setRaion] = useState(order.raion || '')
  const [postCode, setPostCode] = useState(order.postCode || '')
  const [firstClass, setFirstClass] = useState(order.firstClass || false)
  const [other, setOther] =useState(order.other || '')
  const [photo, setPhoto] = useState(order.photos || [])
  const [phoneUser, setPhoneUser] = useState(order.user?.phone || order.phoneUser || '');
  const [notes, setNotes] = useState(order.notes || '')
  const [codeOutside, setCodeOutside] = useState(order.codeOutside || '')
  const [isChanged, setIsChanged] = useState(false);

  const [numRows, setNumRows] = useState(2);
  const [numRows1, setNumRows1] = useState(2);

  useEffect(() => {
    const lineCount = other.split('\n').length;
    setNumRows(lineCount < 2 ? 2 : lineCount);
    const lineCount1 = notes.split('\n').length;
    setNumRows1(lineCount1 < 2 ? 2 : lineCount);
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
      price: order.price || ''
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
      price
    };

    for (const key in initialValues) {
      if (_.isEqual(initialValues[key], currentValues[key]) === false) {
        setIsChanged(true);
        return;
      }
    }

    setIsChanged(false);
  }, [FIO, phone, typePost, city, adress, oblast, raion, postCode, 
      phoneUser, notes, other, codeOutside, setIsChanged, order, photo, firstClass, price]);

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
    firstClass: firstClass,
    ...(phoneUser.length > 1 ? { phoneUser: phoneUser, userId: order.userId, auth:true } : {}),
    adressId: order.adressId, 
    notes: notes,
    codeOutside: codeOutside,
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
      firstClass,
      phoneUser: phoneUser,
      user: users.find(user => user.phone === phoneUser) || {FIO:FIO}
    }
    
    dispatch(updateOrderAction(order.id, dataDispatch))
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

  const AddFormat = () =>{
    const data = {
        type: "photo",
        format: "а6",
        amount: "1",
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
      return sum+PriceList(el.format)*el.amount
  },0 )

  return pr.toFixed(2)
  }

  const showFIO = () =>{
    const pretend = users.find(user => user.phone === phoneUser)
    if(pretend){
      return pretend.FIO
    }else return ''
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


  const copyCode = () =>{
    let text = ''
    
    if(typePost === 'E'){
        text = 
    `
    Здравствуйте. Заказ отправили. 
Сумма наложенного платежа: ${price}р (с учетом пересылки)
Код для отслеживания: ${codeOutside}
    `
    }

    if(typePost === 'R' && !firstClass){
        text = 
    `
    Здравствуйте. Заказ отправили. 
Сумма наложенного платежа: ${price}р
Код для отслеживания: ${codeOutside}
    `
    }

    if(typePost === 'R' && firstClass){
        text = 
    `
    Здравствуйте. Письмо отправили. Вот данные для оплаты:

4255 1901 5302 8421
12/23

сумма ${price}р за заказ +2р пересылка. Итого ${Number(price)+2}р
${codeOutside} - код для отслеживания
    `
    }
    

    return text
}

  return (
    <div className="order_details_card">
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
                  <option value={"E"}>Европочта</option>
                  <option value={"R"}>Белпочта</option>
              </select>
              <label></label>
            </div>
            {typePost==='R'?
              <div className='contact_field'>
                <label>1 класс:</label>
                <input  type='checkbox' checked={firstClass} onChange={(e)=>setFirstClass(e.target.checked)} /> 
              </div>
              :null
            }
            
            <div className='contact_field'>
              <CopyToClipboard text={city}>
              <label>Город:</label>
              </CopyToClipboard>
              <input value={city} onChange={(e)=>setCity(e.target.value)} /> 
            </div>
            <div className='contact_field'>
              <CopyToClipboard text={adress}>
              <label>
                {typePost === 'R' ? 'Адрес:' : 'Отделение:'}
              </label>
              </CopyToClipboard>
              <input value={adress} onChange={(e)=>setAdress(e.target.value)} /> 
            </div>
            
            {typePost === 'R' ? 
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
            <button className='copy_button'  onClick={()=>{setPrice(SumTeor())}}>расчет: {SumTeor()}р</button>
            <input
              className='price_input'
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          
        </div>

        <div className="card_admin">
          <div>
            <div className='info_other'>
              <label>Заметки:</label>
              <textarea rows={numRows1}  value={notes} onChange={(e)=>setNotes(e.target.value)}  />
            </div>

            <div className='info_other'>
              <label>Примечания клиента:</label>
              <textarea rows={numRows} value={other} onChange={(e)=>setOther(e.target.value)} />
            </div>

            <div className='contact_field'>
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
              <label style={{fontSize: 12, flex: 2}}>{showFIO()}</label>
            </div>
            <div className='contact_field'>
              <label>Штрихкод:</label>
              <input style={{marginLeft: 5}} value={codeOutside} onChange={e=>setCodeOutside(e.target.value)} /> 
            </div>

          </div>
          <div className="card_actions">
            <CopyToClipboard text={copyCode()}>
            <button className="copy_button">копировать смс</button>
            </CopyToClipboard>
            <button className="delete_button" onClick={()=>DeleteOrder()}>удалить заказ</button>
          </div>
        </div>
      </div>
    </div>
  );
};