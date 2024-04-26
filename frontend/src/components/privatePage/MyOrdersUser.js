import { useSelector } from 'react-redux'
import { OneOrder } from './OneOrder'
import _ from 'lodash'
import { useNavigate } from 'react-router-dom';
import style from './MyOrder.module.css'

export const MyOrdersUser = () => {

    const orders = useSelector(state => state.private.order);
    const sortedOrders = _.orderBy(orders, 'createdAt', 'desc');
    const navigate = useNavigate()

    return (
            <div className={style.container}>
            {
                sortedOrders.length===0 && 
                <div className={style.listVoid}>
                    <div>У вас еще нету заказов!</div>
                    <button onClick={() => navigate('/Web')}>Cделать заказ</button>
                </div>
            }
            {
                sortedOrders.map((order, index)=> 
                    <div key={order.id}>
                        <OneOrder order={order} index={index} />
                    </div>
                )
            }
            </div>
    )
}