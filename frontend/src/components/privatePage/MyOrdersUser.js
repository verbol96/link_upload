import { useSelector } from 'react-redux'
import { OneOrder } from './OneOrder'
import _ from 'lodash'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const MyOrdersUser = ({ user }) => {

    const orders = useSelector(state => state.private.order);
    const sortedOrders = _.orderBy(orders, 'createdAt', 'desc');
    const navigate = useNavigate()

    // id открытого заказа — только один
    const [openedOrderId, setOpenedOrderId] = useState(null);

    const handleToggle = (orderId) => {
        setOpenedOrderId(prev => prev === orderId ? null : orderId);
    };

    return (
        <div className='pb-3 '>
            {
                sortedOrders.length === 0 &&
                <div className="w-full max-w-md mx-auto mt-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                        <div className="p-6 text-center bg-gradient-to-b from-teal-50/50 to-white">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-900/5 flex items-center justify-center">
                                <i className="bi bi-bag text-2xl text-teal-800"></i>
                            </div>
                            <h3 className="text-base font-semibold text-gray-800 mb-1">
                                Вы ещё не делали заказ
                            </h3>
                            <p className="text-sm text-gray-500">
                                Оформите первый — и он появится здесь.
                            </p>
                        </div>

                        <div className="p-4 ">
                            <button
                                onClick={() => navigate('/Web')}
                                className="w-full inline-flex items-center justify-center gap-2 
                                        px-5 py-2.5 
                                        border-[1px] border-teal-700 hover:bg-teal-900 
                                        text-teal-900 text-sm font-medium 
                                        rounded-lg shadow-sm 
                                        transition-all active:scale-[0.98]"
                            >
                                Оформить заказ
                            </button>
                        </div>
                    </div>
                </div>
            }
            {
                sortedOrders.length !== 0 && <label className='font-light text-sm text-teal-900 my-2 md:hidden'>Количество заказов: {sortedOrders.length}</label>
            }
            {
                sortedOrders.map((order, index) =>
                    <div key={order.id}  >
                        <OneOrder
                            order={order}
                            index={index}
                            isOpened={openedOrderId === order.id}
                            onToggle={() => handleToggle(order.id)}
                        />
                    </div>
                )
            }

        </div>
    )
}