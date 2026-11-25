import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import _ from 'lodash';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/admin/NavBar';
import { Order } from '../components/myOrders/Order';
import { getSettings } from '../http/dbApi';

const orderCountLabel = count => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    const word = mod10 === 1 && mod100 !== 11
        ? 'заказ'
        : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
            ? 'заказа'
            : 'заказов';
    return `${count} ${word}`;
};

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

    const { currentOrders, archivedOrders } = useMemo(() => ({
        currentOrders: sortedOrders.filter(order => Number(order.status) !== 6),
        archivedOrders: sortedOrders.filter(order => Number(order.status) === 6)
    }), [sortedOrders]);

    const priceList = format => {
        return Number(settings.find(el => el.title === format)?.price || 0);
    };

    const renderOrders = list => (
        <div className="space-y-2">
            {list.map(order => (
                <Order
                    key={order.id}
                    order={order}
                    settings={settings}
                    priceList={priceList}
                    expanded={expandedOrderId === order.id}
                    onToggle={() => setExpandedOrderId(prev => prev === order.id ? null : order.id)}
                />
            ))}
        </div>
    );

    const renderHeading = (title, count) => (
        <div className="mb-2.5 flex items-center justify-between gap-3 px-1 md:mb-3">
            <h2 className="text-[11px] font-medium uppercase tracking-wide text-[#64748B] md:text-xs">
                {title}
            </h2>
            <span className="shrink-0 text-[11px] text-[#94A3B8] md:text-xs">
                {orderCountLabel(count)}
            </span>
        </div>
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#FAFBFD] text-slate-800">
            <NavBar />

            <main className="mx-auto w-full max-w-4xl flex-1 px-3 py-4 md:px-6 md:py-6">
                {sortedOrders.length === 0 ? (
                    <div className="mx-auto mt-6 w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="p-6 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                <i className="bi bi-bag text-xl text-slate-700" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800">
                                Заказов пока нет
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                После оформления заказа он появится здесь.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/web')}
                                className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 text-xs font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                            >
                                Оформить заказ
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className='mt-4'>
                        {currentOrders.length > 0 && (
                            <section aria-label="Текущие заказы">
                                {renderHeading('Текущие заказы', currentOrders.length)}
                                {renderOrders(currentOrders)}
                            </section>
                        )}

                        {archivedOrders.length > 0 && (
                            <section aria-label="Архив заказов" className={currentOrders.length > 0 ? 'mt-7 md:mt-8' : ''}>
                                {renderHeading('Архив заказов', archivedOrders.length)}
                                {renderOrders(archivedOrders)}
                            </section>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyOrders;
