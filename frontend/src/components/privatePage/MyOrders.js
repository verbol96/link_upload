import { useState } from 'react'
import { useSelector } from 'react-redux'
import { OneOrder } from './OneOrder'
import './MyOrders.css'
import _ from 'lodash'

export const MyOrders =() =>{

    const orders = _.orderBy(useSelector(state=>state.private.order), 'createdAt', 'desc')
    
    const [selectedOrder, setSelectedOrder] = useState(null);

    const handleDetailsClick = (orderId) => {
        if (selectedOrder === orderId) {
          setSelectedOrder(null);
        } else {
          setSelectedOrder(orderId);
        }
      }; 
      
    return(
        <div>
            <div className='textTitle'>Мои заказы</div>
           {
                orders.map((order, index)=> <OneOrder key={order.id} order={order} index={orders.length - index}
                  handleDetailsClick={handleDetailsClick} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} />
                )
            }
        </div>
    )
}