import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import _ from 'lodash';
import { useNavigate } from 'react-router-dom';

import Footer from "../components/admin/Footer";
import { NavBar } from "../components/admin/NavBar";
import { Order } from "../components/myOrders/Order";
import { getSettings } from "../http/dbApi";

const MyOrders = () => {
    const orders = useSelector(state => state.private.order);
    const [settings, setSettings] = useState([]);
    const navigate = useNavigate();
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    useEffect(() => {
        const getPriceList = async () => {
            try {
                const data = await getSettings();
                setSettings(data);
            } catch (error) {
                console.error('Ошибка загрузки настроек:', error);
            }
        };

        getPriceList();
    }, []);

    const sortedOrders = useMemo(() => {
        return _.orderBy(orders, 'createdAt', 'desc');
    }, [orders]);

    const priceList = (format) => {
        return Number(settings.find(el => el.title === format)?.price || 0);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <NavBar />

            <main className="flex-1 w-full max-w-4xl mx-auto px-3 md:px-6 py-4 md:py-6">
                {sortedOrders.length > 0 && (
                    <div className="flex items-center justify-between px-1 mb-2.5 md:mb-3">
                        <div className="text-[13px] md:text-sm font-medium text-gray-500">
                            
                        </div>
                        <div className="text-[11px] md:text-xs text-gray-400">
                            {sortedOrders.length} {sortedOrders.length === 1 ? 'заказ' : sortedOrders.length < 5 ? 'заказа' : 'заказов'}
                        </div>
                    </div>
                )}

                {sortedOrders.length === 0 ? (
                    <div className="w-full max-w-md mx-auto mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-teal-950/5 flex items-center justify-center">
                                <i className="bi bi-bag text-xl text-gray-800"/>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-800">
                                Заказов пока нет
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                                После оформления заказа он появится здесь.
                            </p>
                            <button
                                type="button"
                                onClick={()=>navigate('/web')}
                                className="mt-4 inline-flex items-center justify-center gap-2 px-4 h-9 rounded-lg bg-[#19766d] hover:bg-[#155f58] text-white text-xs font-medium transition-colors"
                            >
                                Оформить заказ
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedOrders.map(order => (
                            <Order
                                key={order.id}
                                order={order}
                                settings={settings}
                                priceList={priceList}
                                expanded={expandedOrderId===order.id}
                                onToggle={()=>setExpandedOrderId(prev=>prev===order.id?null:order.id)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default MyOrders;