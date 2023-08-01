import { useState } from 'react'
import { useSelector } from 'react-redux'
import { OneOrder } from './OneOrder'
import './MyOrders.css'
import orderBy from 'lodash/orderBy';

export const MyOrders =() =>{

    const order = useSelector(state=>state.private.order)
    

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    const getSortedData = (data, key, direction) => {
        return orderBy(data, [key], [direction]);
      };

      const handleSortClick = () => {
        let direction = 'asc';
        if (sortConfig.direction === 'asc') {
          direction = 'desc';
        }
        setSortConfig({ key: 'createdAt', direction });
      };

    const sortedData = getSortedData(order, sortConfig.key, sortConfig.direction);



    const handleDetailsClick = (orderId) => {
        if (selectedOrder === orderId) {
          setSelectedOrder(null);
        } else {
          setSelectedOrder(orderId);
        }
      };

    return(
        <div>
            <div className='title_list'>
                <div className='first_column'></div>
                <div className='flex_grow' onClick={handleSortClick}>
                    дата
                    {sortConfig.direction === 'asc' ? (
                        <i className="bi bi-arrow-up-short"></i>
                    ) : (
                        <i className="bi bi-arrow-down-short"></i>
                    )}
                </div>
                <div className='flex_grow'>id</div>
                <div className='flex_grow'>город</div>
                <div className='flex_grow'>количество</div>
                <div className='flex_grow'>цена</div>
                <div className='flex_grow'>статус</div>
            </div>


            {
                sortedData.map(order=> <OneOrder key={order.id} order={order}  
                  handleDetailsClick={handleDetailsClick} selectedOrder={selectedOrder} />
                )
            }
        </div>
    )
}