import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { OneOrder } from './OneOrder'
import './MyOrders.css'
import _ from 'lodash'
import { getSettings } from '../../http/dbApi'

export const MyOrders = () => {

    const allOrders = useSelector(state => state.private.order);
    const sortedOrders = _.orderBy(allOrders, 'createdAt', 'desc');

    const [selectedOrder, setSelectedOrder] = useState(null);

    // Initialize the dates as null
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(new Date());

    const startDateSet = useRef(false);

    // Set the start date as the date of the first order when sortedOrders updates
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
            <div className='textTitle1'>Мои заказы</div>
            <div className='datePickerContainer'>
                <i style={{fontSize: 25}} className="bi bi-calendar3"></i>
                <input className='datePickerInput' type="date" value={startDate ? startDate.toISOString().substr(0, 10) : ''} onChange={(e) => handleDateChange(e.target.value, endDate)} />
                <input className='datePickerInput' type="date" value={endDate.toISOString().substr(0, 10)} onChange={(e) => handleDateChange(startDate, e.target.value)} />
            </div>
            <div className='tableFullP'>
            {
                orders.map((order, index)=> 
                    <div key={order.id}>
                        <OneOrder order={order} index={orders.length - index}
                        handleDetailsClick={handleDetailsClick} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} />
                    </div>
                )
            }
            </div>
            <div className='footer_myOrder'>
                <p>Расчет: {calculateTotal()}</p>
            </div>
        </div>
    )
}