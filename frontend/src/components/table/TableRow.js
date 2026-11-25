import { $host } from '../../http/index'
import { updateOrderStatus } from '../../store/orderReducer';
import { useDispatch } from 'react-redux';
import { DescRow } from './DescRow';
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { useMemo } from 'react';


// ============ ХЕЛПЕР ПОДСВЕТКИ ПО date_sent ============
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

export const TableRow = ({ orders, order, handleDetailsClick, selectedOrder, setSelectedOrder,
    collapsedOrderId, isChanged, setIsChanged, descRowRef }) => {

    const dispatch = useDispatch();

    const photo = () => {
        return order.photos.reduce((sum, el) => {
            if (el.paper === 'lustre') {
                return sum + el.amount * el.copies + "шт(" + el.format + ")ЛЮСТР "
            } else {
                return sum + el.amount * el.copies + "шт(" + el.format + ") "
            }
        }, '')
    }

    const handleClick = (event) => {
        event.stopPropagation();
    };

    const PaymentWarning = () => {
        const isErip = ['E1', 'R1', 'R2'].includes(order.typePost);
        if (!isErip) return   <span className={`inline-flex w-[15px] h-[15px] items-center justify-center rounded-[3px] border-[0.5px]`}>
                <i className="bi bi-currency-dollar text-gray-200 text-[10px]"/>
            </span>;

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
                className={`inline-flex w-[15px] h-[15px] items-center justify-center rounded-[3px] border-[1.5px] ${paymentClass[order.isPayment] || paymentClass.none}`}
                title={paymentTitle[order.isPayment] || paymentTitle.none}
            >
                <i className="bi bi-currency-dollar text-gray-700 text-[10px] leading-none"/>
            </span>
        )
    }

    const NotesWarning = () => {
        const hasNotes = order.notes || order.other;

        return (

            <span className="inline-flex w-[15px] h-[15px]  border-[0.5px] rounded-[3px] border-gray-200 items-center justify-center">
                <i className={`bi  ${hasNotes ? 'bi-exclamation-square-fill' : 'bi-exclamation'} text-[15px] leading-none ${hasNotes ? 'text-amber-200' : 'text-gray-200'}`}/>
            </span>
        )
    }

const ColorBG = [
    '#eceff3', // новый — серый
    '#93C5FD', // принят
    '#a395f6', // обработан
    '#f2f87e', // в печати
    '#86EFAC', // упакован
    '#CBD5E1', // отправлен — зелёный
    '#CBD5E1', // оплачен — насыщенный зелёный
    '#CBD5E1', // в ожидании — оранжевый
    '#CBD5E1'  // ошибка — красный
];

    const ChangeStatus = (event) => {
        $host.put(`api/order/updateStatus/${order.id}`, { 'status': event.target.value })
        dispatch(updateOrderStatus(order.id, event.target.value))
    }

    const formatPhoneNumber = (phoneNumberString) => {
        const cleaned = phoneNumberString.replace(/\D/g, '');
        const match = cleaned.match(/^375(\d{2})(\d{3})(\d{2})(\d{2})$/);
        if (match) {
            return '+375 (' + match[1] + ') ' + match[2] + '-' + match[3] + '-' + match[4];
        }
        return 'неверный номер';
    }

    const ShowData = () => {
        const data = `${order.createdAt.split("T")[0].split("-")[2]}.${order.createdAt.split("T")[0].split("-")[1]}.${order.createdAt.slice(2, 4)}`
        const time = `${order.createdAt.split("T")[1].split(":")[0]}:${order.createdAt.split("T")[1].split(":")[1]}`
        return `${data} (${time})`
    }

    const ShowOrigin = () => {
        switch (order.origin) {
            case 'telegram': return <i className="bi bi-send"></i>
            case 'website': return <i className="bi bi-lightning-fill"></i>
            case 'email': return <i className="bi bi-envelope"></i>
            default: return <i className="bi bi-send"></i>
        }
    }

    const hasDuplicate = useMemo(() => {
        const ACTIVE_STATUSES = [0, 1, 2, 3, 4, 7, 8];
        const activeOrders = orders.filter(el => ACTIVE_STATUSES.includes(el.status));

        return activeOrders.filter(el => el.phone === order.phone).length > 1;
    }, [orders, order.phone]);

    const orderNumber = Number(order.order_number);
    const shortNumber = Number.isFinite(orderNumber) ? String(orderNumber % 1000) : '—';
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
            className={`mb-[3px] w-full max-md:w-[600px] overflow-hidden rounded-md border-b bg-white text-[13px] transition-colors duration-150 ${
                isSelected
                    ? 'mt-[20px] mb-[20px] border-[2px] border-[#5C7896] text-black ring-1 ring-[#7890A8]/30 shadow-sm'
                    : isCollapsed
                        ? 'border-[#B9C9D9] bg-[#F0F5F9]'
                        : 'border-[#E2E8F0] hover:border-[#C6D2DF] hover:bg-[#F8FAFC]'
            }`}
            onClick={handleClick}
        >
            <div
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                onDoubleClick={() => handleDetailsClick(order.id)}
                className={`grid grid-cols-[40px_120px_22px_70px_minmax(120px,4fr)_minmax(150px,4fr)_minmax(150px,6fr)_40px_40px_80px_40px_90px] max-md:grid-cols-[20px_90px_18px_55px_150px_40px_40px_80px_40px_50px] items-center min-w-0 px-[3px] pl-[10px] py-[3px] transition-colors ${isSelected ? 'bg-[#5C7896]': ' hover:bg-[#E9EEF3]'}`}
            >
                <div
                    onClick={() => handleDetailsClick(order.id)}
                    className={`text-[12px] px-[5px] flex items-center justify-center max-md:px-[2px] text-[#274C77] `}
                >
                    {ShowOrigin()}
                </div>

                <div className="text-[12px] text-black px-[10px] whitespace-nowrap max-md:px-[2px] max-md:text-center">
                    {ShowData()}
                </div>

                <div className="flex items-center justify-center" title={['Новый', 'Принят', 'Обработан', 'В печати', 'Упакован', 'Отправлен', 'Оплачен', 'В ожидании', 'Ошибка'][Number(order.status)] || 'Статус'}>
                    <span
                        className="h-[10px] w-[10px] rounded-full border-none "
                        style={{ backgroundColor: ColorBG[Number(order.status)] || ColorBG[0] }}
                    />
                </div>

                <CopyToClipboard text={`${displayOrderNumber} ${order?.user?.FIO?.split(' ')?.[0] || ''}`.trim()}>
                    <div
                        className={`text-[12px] font-semibold px-[5px] rounded-md flex justify-center whitespace-nowrap cursor-pointer max-md:px-[2px] max-md:text-center ${isSelected ? 'bg-[#7890A8]' : 'bg-[#EFF4F8]'} `}
                        style={{ color: getDateSentColor(order) }}
                    >
                        {displayOrderNumber}
                    </div>
                </CopyToClipboard>

                <div className="text-[12px] font-medium px-[10px]  whitespace-nowrap overflow-hidden text-ellipsis max-md:hidden">
                    {order?.user?.FIO}
                </div>

                <div
                    className={`text-[12px] px-[10px] text-center whitespace-nowrap max-md:hidden border-md ${hasDuplicate ? 'rounded-md': ''}`}
                    style={{
                        background: hasDuplicate && !isSelected ? '#EFF4F8' : ''
                    }}
                >
                    {formatPhoneNumber(order.phone)}
                </div>

                <div className="text-[12px] px-[10px] text-center whitespace-nowrap overflow-hidden text-ellipsis max-md:px-[2px]">
                    {photo()}
                </div>

                <div className="h-[24px] flex items-center justify-center">
                    <NotesWarning/>
                </div>

                <div
                    className={`w-[15px] h-[15px] rounded-[3px] flex items-center justify-center border-[0.5px] ${
                        order.codeOutside ? 'border-teal-800' : 'border-gray-200'
                    }`}
                >
                    <i className={`bi bi-check text-[12px] leading-none ${
                        order.codeOutside ? 'text-teal-800' : 'text-gray-200'
                    }`}/>
                </div>

                <div className="text-[12px]  px-[6px] text-left whitespace-nowrap ">
                    {(Number(order.price) + Number(order.price_deliver)).toFixed(2)}р
                </div>

                <div className="h-[24px] flex items-center justify-center mr-4">
                    <PaymentWarning/>
                </div>

                <select
                    className="h-[26px] w-full rounded-md border border-[#D4DEE8] px-[8px] text-[12px] font-medium  appearance-none outline-none focus:border-[#7890A8] focus:ring-1 focus:ring-[#7890A8]/30 max-md:w-[50px] max-md:px-[2px]"
                    style={{ backgroundColor: ColorBG[Number(order.status)] || ColorBG[0] }}
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
    )
}