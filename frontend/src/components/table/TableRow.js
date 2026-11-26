import { $host } from '../../http/index';
import { updateOrderStatus } from '../../store/orderReducer';
import { useDispatch } from 'react-redux';
import { DescRow } from './DescRow';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useMemo } from 'react';

// ============ ПОДСВЕТКА ПО date_sent ============

const getDateSentColor = (order) => {
    if ([5, 6, 7, 8].includes(Number(order.status))) return '';

    const dateSent = order.date_sent;
    if (!dateSent) return 'darkgreen';

    const dateOnly = typeof dateSent === 'string'
        ? dateSent.split('T')[0]
        : new Date(dateSent).toISOString().split('T')[0];

    const [y, m, d] = dateOnly.split('-').map(Number);
    if (!y || !m || !d) return 'darkgreen';

    const sentDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentTime = sentDate.getTime();
    const todayTime = today.getTime();

    if (sentTime === todayTime) return '#004ba0';
    if (sentTime < todayTime) return '#dc2626';

    return 'darkgreen';
};

export const TableRow = ({
    orders,
    order,
    handleDetailsClick,
    selectedOrder,
    setSelectedOrder,
    collapsedOrderId,
    isChanged,
    setIsChanged,
    descRowRef
}) => {
    const dispatch = useDispatch();

    const photo = () => {
        return (order.photos || []).reduce((sum, el) => {
            if (el.paper === 'lustre') {
                return sum + el.amount * el.copies + 'шт(' + el.format + ')ЛЮСТР ';
            } else {
                return sum + el.amount * el.copies + 'шт(' + el.format + ') ';
            }
        }, '');
    };

    const handleClick = (event) => {
        event.stopPropagation();
    };

    const PaymentWarning = () => {
        const isErip = ['E1', 'R1', 'R2'].includes(order.typePost);

        if (!isErip) {
            return (
                <span className="inline-flex w-[15px] h-[15px] items-center justify-center rounded-[3px] border-[0.5px]">
                    <i className="bi bi-currency-dollar text-gray-200 text-[10px]" />
                </span>
            );
        }

        const paymentClass = {
            none: 'bg-white border-red-300',
            wait: 'bg-red-200 border-red-300',
            paid: 'bg-green-200 border-green-300'
        };

        const paymentTitle = {
            none: 'ЕРИП не выставлен',
            wait: 'Ожидает оплаты',
            paid: 'Оплачен'
        };

        return (
            <span
                className={`inline-flex w-[15px] h-[15px] items-center justify-center rounded-[3px] border-[1.5px] ${
                    paymentClass[order.isPayment] || paymentClass.none
                }`}
                title={paymentTitle[order.isPayment] || paymentTitle.none}
            >
                <i className="bi bi-currency-dollar text-gray-700 text-[10px] leading-none" />
            </span>
        );
    };

    const NotesWarning = () => {
        const hasNotes = order.notes || order.other;

        return (
            <span className="inline-flex w-[15px] h-[15px] border-[0.5px] rounded-[3px] border-gray-200 items-center justify-center">
                <i
                    className={`bi ${
                        hasNotes
                            ? 'bi-exclamation-square-fill'
                            : 'bi-exclamation'
                    } text-[15px] leading-none ${
                        hasNotes
                            ? 'text-amber-200'
                            : 'text-gray-200'
                    }`}
                />
            </span>
        );
    };

    const ColorBG = [
        '#eceff3',
        '#93C5FD',
        '#a395f6',
        '#f2f87e',
        '#86EFAC',
        '#CBD5E1',
        '#CBD5E1',
        '#CBD5E1',
        '#CBD5E1'
    ];

    const ChangeStatus = (event) => {
        $host.put(`api/order/updateStatus/${order.id}`, {
            status: event.target.value
        });

        dispatch(updateOrderStatus(order.id, event.target.value));
    };

    const formatPhoneNumber = (phoneNumberString) => {
        const cleaned = String(phoneNumberString || '').replace(/\D/g, '');
        const match = cleaned.match(/^375(\d{2})(\d{3})(\d{2})(\d{2})$/);

        if (match) {
            return '+375 (' + match[1] + ') ' + match[2] + '-' + match[3] + '-' + match[4];
        }

        return 'неверный номер';
    };

    const ShowData = (short = false) => {
        const data = `${order.createdAt.split('T')[0].split('-')[2]}.${order.createdAt.split('T')[0].split('-')[1]}.${order.createdAt.slice(2, 4)}`;

        const time = `${order.createdAt.split('T')[1].split(':')[0]}:${order.createdAt.split('T')[1].split(':')[1]}`;

        return `${short ? data.slice(0, 5) : data} (${time})`;
    };

    const ShowOrigin = () => {
        switch (order.origin) {
            case 'telegram':
                return <i className="bi bi-send" />;

            case 'website':
                return <i className="bi bi-lightning-fill" />;

            case 'email':
                return <i className="bi bi-envelope" />;

            default:
                return <i className="bi bi-send" />;
        }
    };

    const hasDuplicate = useMemo(() => {
        const ACTIVE_STATUSES = [0, 1, 2, 3, 4, 7, 8];

        const activeOrders = orders.filter(el =>
            ACTIVE_STATUSES.includes(el.status)
        );

        return activeOrders.filter(el =>
            el.phone === order.phone
        ).length > 1;

    }, [orders, order.phone]);

    const orderNumber = Number(order.order_number);

    const shortNumber = Number.isFinite(orderNumber)
        ? String(orderNumber % 1000)
        : '—';

    const displayOrderNumber = `${order.typePost?.[0] || ''}${shortNumber}`;

    const isSelected = selectedOrder === order.id;
    const isCollapsed = order.id === collapsedOrderId;

    return (
        <div
            style={{
                ...([7, 8].includes(Number(order.status)) && !isSelected
                    ? { opacity: 0.45 }
                    : {})
            }}
            className={`w-full min-w-0 rounded-md overflow-hidden border-b max-md:border bg-white text-[13px] transition-colors duration-150 ${
                isSelected
                    ? 'mt-[20px] mb-[20px] border-[2px] border-[#8DA5BD] text-black ring-1 ring-[#7890A8]/30 shadow-sm'
                    : isCollapsed
                        ? 'mb-[3px] max-md:mb-[5px] border-[#B9C9D9] bg-[#F0F5F9]'
                        : 'mb-[3px] max-md:mb-[5px] border-[#E2E8F0] hover:border-[#C6D2DF] hover:bg-[#F8FAFC]'
            }`}
            onClick={handleClick}
        >
            <div
                style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                }}
                onClick={() => { if (window.matchMedia('(max-width: 767px)').matches) handleDetailsClick(order.id); }}
                onDoubleClick={() => { if (window.matchMedia('(min-width: 768px)').matches) handleDetailsClick(order.id); }}
                className={`
                    grid w-full min-w-0
                    md:grid-cols-[30px_110px_22px_60px_minmax(0,4fr)_minmax(0,6fr)_30px_25px_70px_30px_90px]
                    min-[1200px]:grid-cols-[40px_120px_22px_70px_minmax(0,4fr)_165px_minmax(0,6fr)_40px_40px_80px_40px_90px]
                    grid-cols-[20px_48px_minmax(0,1fr)_78px] max-md:gap-y-1
                    items-center px-[3px] pl-[10px] py-[3px]
                    transition-colors
                    ${isSelected
                        ? 'md:bg-[#8DA5BD] '
                        : 'md:hover:bg-[#E9EEF3]'
                    }
                `}
            >
                {/* Источник заказа */}

                <div
                    onClick={e => { e.stopPropagation(); handleDetailsClick(order.id); }}
                    className="text-[12px] px-[5px] flex items-center justify-center max-md:px-[2px] max-md:col-start-1 max-md:row-start-1 text-[#274C77]"
                >
                    {ShowOrigin()}
                </div>

                {/* Дата заказа */}

                <div className="text-[12px] text-black px-[10px] whitespace-nowrap max-md:px-[2px] max-md:text-center max-md:col-span-2 max-md:col-start-1 max-md:row-start-2 max-md:text-[9px]">
                    <span className="hidden md:inline">{ShowData()}</span>
                    <span className="md:hidden">{ShowData(true)}</span>
                </div>

                {/* Индикатор статуса */}

                <div
                    className="flex items-center justify-center max-md:hidden"
                    title={
                        [
                            'Новый',
                            'Принят',
                            'Обработан',
                            'В печати',
                            'Упакован',
                            'Отправлен',
                            'Оплачен',
                            'В ожидании',
                            'Ошибка'
                        ][Number(order.status)] || 'Статус'
                    }
                >
                    <span
                        className="h-[10px] w-[10px] rounded-full border-none"
                        style={{
                            backgroundColor: ColorBG[Number(order.status)] || ColorBG[0]
                        }}
                    />
                </div>

                {/* Номер заказа */}

                <CopyToClipboard
                    text={`${displayOrderNumber} ${order?.user?.FIO?.split(' ')?.[0] || ''}`.trim()}
                >
                    <div
                        className={`text-[12px] font-semibold px-[5px] rounded-md flex justify-center whitespace-nowrap cursor-pointer max-md:px-[2px] max-md:text-center max-md:col-start-2 max-md:row-start-1 ${
                            isSelected
                                ? 'bg-[#EFF4F8]'
                                : 'bg-[#EFF4F8]'
                        }`}
                        onClick={e => { if (window.matchMedia('(min-width: 768px)').matches) e.stopPropagation(); }}
                        style={{
                            color: getDateSentColor(order)
                        }}
                    >
                        {displayOrderNumber}
                    </div>
                </CopyToClipboard>

                {/* ФИО */}

                <div
                    className="min-w-0 truncate text-[12px] font-medium px-[10px] max-md:col-start-3 max-md:row-start-1 max-md:px-1 max-md:text-center max-md:text-[13px] max-md:font-semibold max-md:text-[#274C77]"
                    title={order?.user?.FIO}
                >
                    {order?.user?.FIO}
                </div>

                {/* Телефон */}

                <div
                    className={`min-w-0 truncate text-[12px] px-[10px] text-center hidden min-[1200px]:block ${
                        hasDuplicate ? 'rounded-md' : ''
                    }`}
                    style={{
                        background: hasDuplicate && !isSelected
                            ? '#EFF4F8'
                            : ''
                    }}
                >
                    {formatPhoneNumber(order.phone)}
                </div>

                {/* Фотографии */}

                <div
                    className="min-w-0 truncate text-[12px] px-[10px] text-center max-md:px-[2px] max-md:col-start-3 max-md:row-start-2 max-md:text-left max-md:text-[10px] max-md:text-slate-500"
                    title={photo()}
                >
                    {photo()}
                </div>

                {/* Заметки и примечания */}

                <div className="h-[24px] flex items-center justify-center max-md:hidden">
                    <NotesWarning />
                </div>

                {/* Трек-номер */}

                <div className="flex items-center justify-center max-md:hidden">
                    <div
                        className={`w-[15px] h-[15px] rounded-[3px] flex items-center justify-center border-[0.5px] ${
                            order.codeOutside
                                ? 'border-teal-800'
                                : 'border-gray-200'
                        }`}
                    >
                        <i
                            className={`bi bi-check text-[12px] leading-none ${
                                order.codeOutside
                                    ? 'text-teal-800'
                                    : 'text-gray-200'
                            }`}
                        />
                    </div>
                </div>

                {/* Стоимость */}

                <div className="min-w-0 truncate text-[12px] px-[6px] text-left max-md:px-[2px] max-md:col-start-4 max-md:row-start-1 max-md:text-center">
                    {(Number(order.price) + Number(order.price_deliver)).toFixed(2)}р
                </div>

                {/* Оплата */}

                <div className="h-[24px] flex items-center justify-center max-md:hidden">
                    <PaymentWarning />
                </div>

                {/* Выбор статуса */}

                <select
                    className="h-[26px] w-full min-w-0 rounded-md border border-[#D4DEE8] px-[8px] text-[12px] font-medium appearance-none outline-none focus:border-[#7890A8] focus:ring-1 focus:ring-[#7890A8]/30 max-md:px-[2px] max-md:col-start-4 max-md:row-start-2"
                    onClick={e => e.stopPropagation()}
                    onDoubleClick={e => e.stopPropagation()}
                    style={{
                        backgroundColor: ColorBG[Number(order.status)] || ColorBG[0]
                    }}
                    value={order.status}
                    onChange={ChangeStatus}
                >
                    <option value="0">новый</option>
                    <option value="1">принят</option>
                    <option value="2">обработан</option>
                    <option value="3">в печати</option>
                    <option value="4">упакован</option>
                    <option value="5">отправлен</option>
                    <option value="6">оплачен</option>
                    <option value="7">в ожидании</option>
                    <option value="8">ошибка</option>
                </select>
            </div>

            {isSelected && (
                <DescRow
                    ref={descRowRef}
                    key={order.id}
                    orders={orders}
                    order={order}
                    setSelectedOrder={setSelectedOrder}
                    handleDetailsClick={handleDetailsClick}
                    isChanged={isChanged}
                    setIsChanged={setIsChanged}
                />
            )}
        </div>
    );
};
