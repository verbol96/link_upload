import {React, useEffect, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import _ from 'lodash'
import {$host} from '../../http/index'
import { TableRow } from './TableRow'
import './TableFull.css'
import { addOrder, saveOrders, saveSettings, saveUsers } from '../../store/orderReducer'
import { TableFooter } from './TableFooter'


export const TableFull = ({selectedOrder, setSelectedOrder, collapsedOrderId, setCollapsedOrderId, handleDetailsClick}) =>{

    
    const dispach = useDispatch()
     
    const [sortKey, setSortKey] = useState('default');

    // Получение данных из Redux
    let orders =_.orderBy(_.orderBy(useSelector(state => state.order.order), 'createdAt', 'desc' ), 'status', 'asc' )
  
    // Функция сортировки
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

    // Выполнение сортировки
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
    const handleSearchChange = (e) => {
      setSearchQuery(e.target.value);
    };
    
    const handleSelectChange = (e) => {
      setSelectedType(e.target.value);
    };

    const AddNewOrder = async() =>{
      const userConfirmation = window.confirm("Добавить новый заказ?");

      const getRandomPhoneNumber = () => {
        const getRandomInt = (min, max) => {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    
        let phoneNumber = "+37500";
        for (let i = 0; i < 3; i++) {
            phoneNumber += getRandomInt(0, 9);
        }
        phoneNumber +="0000";
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
    

    const filteredOrders = orders
      .filter((order) => {
        if (selectedType === order.typePost) {
          return true;
        }
        if (selectedType === 'All') {
          return true;
        }

        return order.typePost === selectedType;
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
                     order.user.FIO+
                     order.user.phone
        return data.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .filter(s=>filterCheck.includes(Number(s.status)));

    const DownloadArchive = () =>{
      $host.get('api/order/getAllArchive').then(
        res=> {
            dispach(saveOrders(res.data.orders))
            dispach(saveSettings(res.data.settings))
            dispach(saveUsers(res.data.users))
        }
    )  
    }
    

    return(
        <>
            
            <div className="menu-container">
                
                <div className="menu-left">
                    <button className="menu-button"  onClick={()=>AddNewOrder()}><i style={{color: 'white'}} className="bi bi-folder-plus" ></i></button>
                    <select className="menu-select" onChange={handleSelectChange}>
                        <option value={'All'}>Европочта и Белпочта</option>
                        <option value={"E"}>только Европочта</option>
                        <option value={"R"}>только Белпочта</option>
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
                                collapsedOrderId={collapsedOrderId} setCollapsedOrderId={setCollapsedOrderId} /></div>)}
            </div>
            <TableFooter filteredOrders={filteredOrders} />
        </>
    )
}

