import { useSelector } from 'react-redux'
import { OneOrder } from './OneOrder'
import _ from 'lodash'
import { useNavigate } from 'react-router-dom';
import style from './MyOrder.module.css'

export const MyOrdersUser = ({user}) => {

    const orders = useSelector(state => state.private.order);
    const sortedOrders = _.orderBy(orders, 'createdAt', 'desc');
    const navigate = useNavigate()

    return (
            <div  className='pb-3 '>
            {
                sortedOrders.length===0 && 
                <div className={style.listVoid}>
                    <div>У вас еще нету заказов!</div>
                    <button onClick={() => navigate('/Web')}>Cделать заказ</button>
                </div>
            }
            <label className='font-light text-sm text-teal-900 my-2 md:hidden'>Количество заказов: {sortedOrders.length}</label>
            {
                
                sortedOrders.map((order, index)=> 
                    <div key={order.id}  >
                        <OneOrder order={order} index={index} />
                    </div>
                )
            }
           
            </div>
    )
}