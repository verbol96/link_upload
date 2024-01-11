import { useSelector } from 'react-redux'
import { OneOrder } from './OneOrder'
import _ from 'lodash'

export const MyOrdersUser = () => {

    const orders = useSelector(state => state.private.order);
    const sortedOrders = _.orderBy(orders, 'createdAt', 'desc');


    return (
            <>
            {
                sortedOrders.map((order, index)=> 
                    <div key={order.id}>
                        <OneOrder order={order} index={orders.length - index} />
                    </div>
                )
            }
            </>
    )
}