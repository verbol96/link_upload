import {React, useEffect, useState, useRef} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import _ from 'lodash'
import {$host} from '../../http/index'
import { TableRow } from './TableRow'
import './TableFull.css'
import { addOrder, saveOrders, saveSettings, saveUsers, updateOrderStatus } from '../../store/orderReducer'
import { TableFooter } from './TableFooter'
import style from './TableFull.module.css'
import { ModalOrder } from './ModalOrder'


export const TableFull = ({selectedOrder, setSelectedOrder, collapsedOrderId, setCollapsedOrderId, handleDetailsClick, isChanged, setIsChanged}) =>{

    
    const dispach = useDispatch()
     
    const [sortKey, setSortKey] = useState('default');

    let orders =_.orderBy(_.orderBy(useSelector(state => state.order.order), 'createdAt', 'desc' ), 'status', 'asc' )

    const sortOrders = (orders, sortKey) => {
      switch (sortKey) {
        case 'price':
          return _.orderBy(orders, [item => Number(item.price)], 'desc');
        case 'data':
          return _.orderBy(orders, ['createdAt'], 'desc');
        case 'city':
          return _.orderBy(orders, [item => item.city.toLowerCase()], 'asc');
        case 'FIO':
          return _.orderBy(orders, item => item.user && item.user.FIO ? item.user.FIO.trim() : '', 'asc');
        default:
          return orders;
      }
    };

    orders = sortOrders(orders, sortKey);
  
    const handleSortChange = (e) => {
      setSortKey(e.target.value);
    };

    useEffect(()=>{
        $host.get('api/order/getAll').then(
            res=> {
                dispach(saveOrders(res.data.orders))
                dispach(saveSettings(res.data.settings))
                dispach(saveUsers(res.data.users))
            }
        )  
    },[dispach])

    const [searchQuery, setSearchQuery] = useState(''); // для поиска
    const [selectedType, setSelectedType] = useState('All'); /// для белпочта/европочта
    const [origin, setOrigin] = useState('All'); /// для белпочта/европочта

    const handleSearchChange = (e) => {
      setSearchQuery(e.target.value);
    };
    
    const handleSelectChange = (e) => {
      setSelectedType(e.target.value);
    };

    const OriginChange = (e) =>{
      setOrigin(e.target.value)
    }

    const AddNewOrder = async() =>{
      const userConfirmation = window.confirm("Добавить новый заказ?");

      const getRandomPhoneNumber = () => {
        const getRandomInt = (min, max) => {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    
        let phoneNumber = "+37500";
        for (let i = 0; i < 4; i++) {
            phoneNumber += getRandomInt(0, 9);
        }
        phoneNumber +="000";
        return phoneNumber;
    }
    
      if (userConfirmation) {
        const data = {
          name: '',
          phone: getRandomPhoneNumber(),
          typePost: 'E',
          city: '',
          adress: '',
          oblast: '',
          raion: '',
          postCode: '',
          photo: [],
          other: '',
          price: '',
          firstClass: false,
          status:1
        };
  
      const response = await $host.post('api/order/addOrder', data)
      
      dispach(addOrder(response.data))
      const newOrderDate = new Date(response.data.createdAt);
      setEndDate(prevEndDate => newOrderDate > prevEndDate ? newOrderDate : prevEndDate);
      }
    }

    const [statusFilterVisible, setStatusFilterVisible] = useState(false);

    const handleStatusFilterMouseEnter = () => {
      setStatusFilterVisible(true);
    };
    
    const handleStatusFilterMouseLeave = () => {
      setStatusFilterVisible(false);
    };

    const [filterCheck, setFilterCheck] = useState([0,1,2,3,4])
    const Check = (e, id) =>{
      if(e){
          setFilterCheck(filterCheck.concat(id))
      }else{
          setFilterCheck(
              filterCheck.filter(el=>!id.includes(el))
          )
      }

  }

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(new Date());

    const filteredOrders = orders
      .filter((order) => {
        if (selectedType === '1' & order.firstClass) {
          return true;
        }
        if (selectedType === order.typePost) {
          return true;
        }
        if (selectedType === 'All') {
          return true;
        }

        return order.typePost === selectedType;
      })
      .filter((order) => {
        if (origin === order.origin) {
          return true;
        }
        if (origin === 'All') {
          return true;
        }

        return order.origin === origin;
      })
      .filter((order) => {
        const data = order.FIO+
                     order.adress+
                     order.city+
                     order.phone+
                     order.postCode+
                     order.codeOutside+
                     order.other+
                     order.price+
                     order.name+
                     order.phone+
                     order.notes+
                     order.user?.FIO+
                     order.user?.phone
        return data.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .filter(s=>filterCheck.includes(Number(s.status)))
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return !startDate || !endDate || (orderDate >= startDate && orderDate <= endDate);
    });


    const startDateSet = useRef(false);
    
    useEffect(() => {
      if (orders.length > 0 && !startDateSet.current) {
          let ordersDataStart =_.orderBy(orders, 'createdAt', "desc" )
          setStartDate(new Date(ordersDataStart[orders.length - 1].createdAt));
          startDateSet.current = true;
      }
    }, [orders]);
    
    const handleDateChange = (start, end) => {
        setStartDate(new Date(start));
        setEndDate(new Date(end));
    }

    const DownloadArchive = () =>{
      $host.get('api/order/getAllArchive').then(
        res=> {
            dispach(saveOrders(res.data.orders))
            dispach(saveSettings(res.data.settings))
            dispach(saveUsers(res.data.users))
    
            // Добавьте следующую строку для обновления startDate
            let ordersDataStart =_.orderBy(res.data.orders, 'createdAt', "desc" )
            setStartDate(new Date(ordersDataStart[ordersDataStart.length - 1].createdAt));
        }
      )  
    }

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      if(window.innerWidth < 769) setIsMobile(true)
    }, []);

    const ShowOrigin = (order) =>{
          switch(order.origin){
              case 'telegram': return <i style={{color: 'darkgreen'}} className="bi bi-send"></i>
              case 'website': return <i style={{color: 'darkgreen'}} className="bi bi-lightning-fill"></i>  
              case 'email': return <i style={{color: 'darkgreen'}} className="bi bi-envelope"></i>
              default:  return <i style={{color: 'darkgreen'}} className="bi bi-send"></i>
          }
      }
      const photo = (order) =>{
        return order.photos.reduce((sum, el)=>{
          if(el.paper==='lustre'){
              return sum+el.amount*el.copies+"шт("+el.format+")ЛЮСТР "
          }else{
              return sum+el.amount*el.copies+"шт("+el.format+") "
          }
      }, '')
      
    }

    const ShowData = (order) =>{

      const data = `${order.createdAt.split("T")[0].split("-")[2]}.${order.createdAt.split("T")[0].split("-")[1]}`
      const time = `${order.createdAt.split("T")[1].split(":")[0]}:${order.createdAt.split("T")[1].split(":")[1]}`
      return `${data} (${time})`
    }

    const ColorBG = [
      '#97d0d6',// принят -1
      '#D8BFD8',//обработан -2
      '#FDFD96',// в печати -3
      '#98FF98',// упакован -4
      'DarkGrey',// отправлено -5
      'white'// оплачено -6
    ]

    const ChangeStatus = (event, order) =>{
      $host.put(`api/order/updateStatus/${order.id}`, {'status': event.target.value})
      dispach(updateOrderStatus(order.id, event.target.value))
      setOrderModal(prev=>({...prev, status: event.target.value}))
    }

    const Warning = (order) =>{
        let a = []
        if(order.codeOutside){
            a.push(
                <i 
                className="bi bi-qr-code" 
                style={{marginLeft: 5}}
                > </i>)
        }
        if(order.firstClass === true){
          a.push( <i className="bi bi-1-square-fill pr-1" style={{color:'red', marginLeft: 5}}> </i>)
        }
        if(order.notes){
            a.push( <i className="bi bi-exclamation-square-fill" style={{color: 'orange', marginLeft: 5}}> </i>)
        }
        if(order.other){
            a.push( <i className="bi bi-exclamation-square-fill" style={{color: 'yellowgreen', marginLeft: 5}}> </i>)
        }
        
        return a.map((el, index)=><span key={index}>{el} </span>)
    }

    const handleProcess = (e) =>{
      switch(e){
        case '1': return setFilterCheck([0, 1, 2, 3, 4])
        case '2': return setFilterCheck([5])
        case '3': return setFilterCheck([6])
        default: return setFilterCheck([0, 1, 2, 3, 4])
      }
      
    }

    const [activeModal, setActiveModal] = useState(false)
    const [orderModal, setOrderModal] = useState({})

    const ClickOrder = (order) =>{
          setActiveModal(true)
          setOrderModal(order)
    }

    return(
        <>
            {isMobile ? 
              <div className={style.mobileMain}>
                {activeModal?
                  <ModalOrder order={orderModal} activeModal={activeModal} setActiveModal={setActiveModal} ChangeStatus={ChangeStatus}  />
                :
                <>
                <div className={style.menu}>
                    <select onChange={handleSelectChange}>
                            <option value={'All'}>all</option>
                            <option value={"E"}>E</option>
                            <option value={"R"}>R</option>
                    </select>
                    <select onChange={OriginChange}>
                            <option value={'All'}>all</option>
                            <option value={'website'}>Web</option>
                            <option value={'telegram'}>Telegram</option>
                            <option value={'email'}>eMail</option>
                    </select>
                    <input
                          type="text"
                          placeholder="Поиск"
                          value={searchQuery}
                          onChange={handleSearchChange}
                    />
                    <select defaultValue={'1'} onChange={e=>handleProcess(e.target.value)}>
                        <option value={'1'}>в работе</option>
                        <option value={'2'}>отправленные</option>
                        <option value={'3'}>оплаченные</option>
                    </select>
                </div>
                <div>
                {filteredOrders.map(order => 
                  <div key={order.id} onClick={(event)=>event.stopPropagation()}>

                      <div className={selectedOrder===order.id ? style.mobileOrderSelected: style.mobileOrder} onClick={()=>ClickOrder(order)}>
                        <div className={style.origin}>
                          <div className={style.circle}>{ShowOrigin(order)} &nbsp; {order.typePost + (order.order_number%1000) }</div>
                          <div>{ShowData(order)}</div>
                        </div>
                        <div className={style.contact}>
                          <div>{order.FIO}</div>
                          <div className={style.contact2}> 
                            <div className={style.dataPhoto}>{photo(order)}</div>
                            <div>{Warning(order)} </div>
                          </div>
                        </div>
                        <div className={style.data}>
                            <div>{(Number(order.price) + Number(order.price_deliver)).toFixed(2)}р</div>
                            <div  onClick={(event)=>event.stopPropagation()}>
                              <select style={{backgroundColor: ColorBG[order.status-1]}} value={order.status} onChange={(e)=>ChangeStatus(e, order)} >
                                <option value="0">новый</option>
                                <option value="1">принят</option>
                                <option value="2">обработан</option>
                                <option value="3">в печати</option>
                                <option value="4">упакован</option>
                                <option value="5">отправлен</option>
                                <option value="6">оплачен</option>
                              </select>
                            </div>
                        </div>
                      </div>
                  </div>
                  )
                }
                <TableFooter filteredOrders={filteredOrders} />
                </div>
                </>}
              </div>
              :
              <> 
                <div className="menu-container">
                    
                    <div className="menu-left">
                        <button className="menu-button"  onClick={()=>AddNewOrder()}><i style={{color: 'white'}} className="bi bi-folder-plus" ></i></button>
                        <select className="menu-select" onChange={handleSelectChange}>
                            <option value={'All'}>Европочта и Белпочта</option>
                            <option value={"E"}>только Европочта</option>
                            <option value={"R"}>только Белпочта</option>
                            <option value={"1"}>только 1класс</option>
                        </select>
                        <select className="menu-select" style={{marginLeft: 0}} onChange={OriginChange}>
                            <option value={'All'}>Сайт, телеграм, почта</option>
                            <option value={'website'}>только сайт</option>
                            <option value={'telegram'}>только телеграм</option>
                            <option value={'email'}>только почта</option>
                        </select>
                        <input
                          className="menu-input"
                          type="text"
                          placeholder="Поиск"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <select className="menu-select"  onChange={handleSortChange}>
                            <option value={'default'}>по умолчанию</option>
                            <option value={'price'}>по цене</option>
                            <option value={'data'}>по дате</option>
                            <option value={'city'}>по городу</option>
                            <option value={'FIO'}>по имени</option>
                        </select>
                        
                        <input className='menu-input' style={{textAlign: 'center'}} type="date" value={startDate ? startDate.toISOString().substr(0, 10) : ''} onChange={(e) => handleDateChange(e.target.value, endDate)} />
                        <i style={{color: '#2f616b'}} className="bi bi-chevron-right"></i>
                        <input className='menu-input' style={{textAlign: 'center'}} type="date" 
                                    value={endDate.toLocaleDateString().split('.')[2]+'-'+endDate.toLocaleDateString().split('.')[1]+'-'+endDate.toLocaleDateString().split('.')[0]}
                                    onChange={(e) => handleDateChange(startDate, e.target.value)} />
                    
                    </div> 

                    <div
                      className="menu-right"
                      onMouseEnter={handleStatusFilterMouseEnter}
                      onMouseLeave={handleStatusFilterMouseLeave}
                    >
                      <div className="status-filter-container">
                        <button className="menu-button">
                          <i style={{color: 'white'}} className="bi bi-filter-square"></i>
                        </button>
                        {statusFilterVisible && (
                          <div className="status-filter-popup">
                          <label>
                            <input
                              type="checkbox"
                              checked={filterCheck.includes(1) && filterCheck.includes(2) && filterCheck.includes(3) && filterCheck.includes(4)}
                              onChange={(e) => Check(e.target.checked, [0, 1, 2, 3, 4])}
                            />
                            В работе
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={filterCheck.includes(5)}
                              onChange={(e) => Check(e.target.checked, [5])}
                            />
                            Отправленные
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={filterCheck.includes(6)}
                              onChange={(e) => Check(e.target.checked, [6])}
                            />
                            Оплаченные
                          </label>
                          <label>
                            <button onClick={() => DownloadArchive()}>загрузить архив</button>
                              
                          </label>
                        </div>
                        )}  
                    
                      </div>
                      
                    </div>
                    
                </div> 
                <div className='tableFull'>
                {filteredOrders.map(order => 
                  <div key={order.id} ><TableRow order={order} 
                                    handleDetailsClick={handleDetailsClick} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder}
                                    collapsedOrderId={collapsedOrderId} setCollapsedOrderId={setCollapsedOrderId}
                                    isChanged={isChanged} setIsChanged={setIsChanged}  /></div>)}
                </div>
                <TableFooter filteredOrders={filteredOrders} />
              </>
            }
        </>
    )
}

