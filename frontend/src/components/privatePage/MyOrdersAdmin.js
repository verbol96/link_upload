import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { OneOrder } from './OneOrder'
import _ from 'lodash'
import { getSettings } from '../../http/dbApi'
import style from './MyOrder.module.css'

export const MyOrdersAdmin = () => {

    const allOrders = useSelector(state => state.private.order);
    const sortedOrders = _.orderBy(allOrders, 'createdAt', 'desc');

    const [selectedOrder, setSelectedOrder] = useState(null);

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(new Date());

    const startDateSet = useRef(false);

    useEffect(() => {
        if (sortedOrders.length > 0 && !startDateSet.current) {
            setStartDate(new Date(sortedOrders[sortedOrders.length - 1].createdAt));
            startDateSet.current = true;
        }
    }, [sortedOrders]);

    const handleDetailsClick = (orderId) => {
        if (selectedOrder === orderId) {
            setSelectedOrder(null);
        } else {
            setSelectedOrder(orderId);
        }
    }; 

    const handleDateChange = (start, end) => {
        setStartDate(new Date(start));
        setEndDate(new Date(end));
    }

    const orders = sortedOrders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return !startDate || !endDate || (orderDate >= startDate && orderDate <= endDate);
    });

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

    const SumTeor =(photo)=> {
        const pr = photo.reduce((sum, el)=>{
        return sum+PriceList(el.format)*el.amount
    },0 )

    return pr.toFixed(2)
    }

    const calculateTotal = () => {
        const total = orders.reduce((sum, order)=>{
          if(order.firstClass) return sum-Number(order.price)-Number(order.price_deliver)
          else return sum+Number(order.price)-SumTeor(order.photos)*0.8
        },0)
        return total.toFixed(2);
    }

    return (
        <div>
 
            <div className={style.menu}>
                <i style={{fontSize: 25, color: '#116466'}} className="bi bi-calendar3"></i>
                <input type="date" value={startDate ? startDate.toISOString().substr(0, 10) : ''} onChange={(e) => handleDateChange(e.target.value, endDate)} />
                <input type="date" value={endDate.toISOString().substr(0, 10)} onChange={(e) => handleDateChange(startDate, e.target.value)} />
            </div>
        
            <div>
            {
                orders.map((order, index)=> 
                    <div key={order.id}>
                        <OneOrder order={order} index={index}
                        handleDetailsClick={handleDetailsClick} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} />
                    </div>
                )
            }
            </div>

            <div className={style.footer}>    
                <div>Расчет: {calculateTotal()}</div>
            </div>

        </div>
    )
}