import { useState, useEffect } from 'react';
import { OneOrderFile } from './OneOrderFile';
import {CopyToClipboard} from 'react-copy-to-clipboard'
import { deleteOrder, getSettings } from '../../http/dbApi';
import { deleteOrderId } from '../../store/orderReducer';
import { useDispatch, useSelector } from 'react-redux';
import { deleteFile } from '../../http/cloudApi';


export const OneOrder = ({order, index}) =>{

    const [selectedOrder, setSelectedOrder] = useState(false);
    const user = useSelector(state=>state.private.user)
    const [isCopy, setIsCopy] = useState(false)
    const dispatch = useDispatch()

    const handleDetailsClick = () => {
        setSelectedOrder(prev=>!prev)
    }; 
    
    const formatPhoneNumber = (phoneNumberString) => {
    const cleaned = phoneNumberString.replace(/\D/g, '');
    const match = cleaned.match(/^375(\d{2})(\d{3})(\d{2})(\d{2})$/);
    if (match) {
        return '+375 (' + match[1] + ') ' + match[2] + '-' + match[3] + '-' + match[4];
    }
    return 'неверный номер';
    }

   const StatusOrder = [
    'новый', //0
    'принят',//1
    'готов к печати',//2
    'в печати', //3
    'упакован',//4
    'отправлен',//5
    'получен',//6
    'в ожидании',//7
    'ошибка',//8
    ]

    const ShowPost =() =>{
        switch(order.typePost){
            case 'E': return 'Европочта(наложенный)'
            case 'E1': return 'Европочта(оплата ЕРИП)'
            case 'R1': return 'Письмо(оплата ЕРИП)'
            case 'R2': return 'Белпочта(оплата ЕРИП)'
            case 'R': return 'Белпочта(наложенный)'
            
            default: return 'Европочта'
        }
    }

    const DeleteOrder = async() =>{
        const userConfirmation = window.confirm("Вы уверены, что хотите удалить этот заказ?");
    
        if (userConfirmation) {
          await deleteOrder(order.id);
          dispatch(deleteOrderId(order.id));
          await deleteFile(order.main_dir_id)
        }
    }

    const MessageStatus = [
        <label>Заказ поступил нам. Ожидает проверки сотрудником. В этом статусе вы еще можете <span style={{color:'red', cursor: 'pointer'}} onClick={()=>{DeleteOrder()}}>удалить заказ</span></label>,// новый
        'Заказ проверен сотрудником. Сейчас подготавливаем файлы к печати.',//принят
        'Файлы подготовлены к печати. Заказ в очереди на печать.',// обработан
        'Заказ сейчас находится на стадии печати.',// в печати
        'Печать заказа завершена, и он был аккуратно упакован для безопасной пересылки.',// упакован
        'Ваш заказ был передан на отправку. По штрихкоду можете его отслеживать.',// отправлен
        'Спасибо за заказ. Будем рады помочь снова', //оплачен 
        'Особый статус, обычно заказ готов, а вероятные причины: ожидание оплаты, либо дня отправки, либо добавления фото. Для уточнения можете написать нам в телеграм/инстаграм ',// в ожидании
        <label>Ошибка в заказе. Вероятно не загрузились фото.
            Можете загрузить заново, а этот <span style={{color:'red', cursor: 'pointer'}} onClick={()=>{DeleteOrder()}}>удалить заказ</span>. Либо напишите нам в Телеграм/Инстаграм</label>,// ошибка
       
      ]
    const CopyCode =  () =>{
        setIsCopy(true)
        setTimeout(()=>{
            setIsCopy(false)
        }, 1500)
    }

    const SumTeor =()=> {
        const pr = order.photos.reduce((sum, el)=>{
            return sum+PriceList(el.format)*el.amount*el.copies
        },0 )

        return pr.toFixed(2)
    }

    const [settings, setSettings] = useState([])

    useEffect(()=>{
        async function getPriceList (){
            let value = await getSettings()
            setSettings(value)
        }
        getPriceList()

    }, [])

    const PriceList = (format) =>{
        let price = 0
        settings.forEach(el=>{
        
            if(el.title === format) {
            
                price = el.price
            }
        })

        return price
    }

    const textMessage = () =>{
        let text

        if(order.typePost === 'E')
            text = `Ваш заказ передан на отправку. По штрихкоду можете его отследить: ${order.codeOutside}. Стоимость ${order.price}р + доставка ${order.price_deliver}р`

        if(order.typePost === 'R')
            text = `Ваш заказ передан на отправку. Отследить можете по ссылке: https://belpost.by/Otsleditotpravleniye?number=${order.codeOutside}. Стоимость ${order.price}р`

        return text
    }

    const [showDetails, setShowDetails] = useState(false);

    return(
        <>
        {
            selectedOrder ?
            <div className="mt-2 w-full bg-white rounded-xl shadow-sm border-[1px] border-teal-700 overflow-hidden">

                {/* Шапка — клик для сворачивания */}
                <div
                    onClick={handleDetailsClick}
                    className="flex items-center justify-between px-4 md:px-5 py-3 
                            border-b border-gray-100 cursor-pointer hover:bg-gray-50
                            transition-colors"
                >
                    <div className="flex items-center gap-6">
                        <i className="bi bi-caret-up-fill text-teal-700 text-lg md:text-xl"></i>
                        <span className="text-sm md:text-base font-semibold text-gray-800">
                            Заказ от {order.createdAt.split("T")[0].split("-")[2]}.
                            {order.createdAt.split("T")[0].split("-")[1]}.
                            {order.createdAt.split("T")[0].split("-")[0]}
                        </span>
                    </div>

                    
                </div>

                {/* Контент — 2 колонки на десктопе, 1 на мобилке */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5">

                
                {/* === БЛОК: Данные отправления === */}
                <div className=" overflow-hidden">

                {/* === ШАПКА (всегда видна) === */}
                <div
                    onClick={() => setShowDetails(prev => !prev)}
                    className="w-full flex items-center gap-3 
                            px-3 md:px-4 py-3
                            bg-gray-50/80
                            border-[1px] border-teal-900/50  rounded-xl   text-left
                            overflow-hidden"
                >
                    {/* Иконка */}
                    <div className="w-8 h-8 rounded-full bg-gray-300/50 flex items-center justify-center shrink-0">
                        <i className="bi bi-truck text-black text-sm"></i>
                    </div>

                    {/* Текст */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="text-sm font-semibold text-gray-800 truncate">
                            Данные отправления
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                            {order.FIO}
                        </div>
                    </div>

                    {/* Треугольник справа */}
                    <i className={`bi bi-caret-${showDetails ? 'up' : 'down'}-fill 
                                text-teal-700 text-lg shrink-0`}></i>
                </div>

                {/* === КОНТЕНТ (только при раскрытии) === */}
                {showDetails && (
                    <div className="p-3 md:p-4 space-y-3 bg-white ">

                        {/* Дата */}
                        <div className="flex items-start gap-3">
                            <i className="bi bi-calendar text-gray-400 mt-0.5 shrink-0"></i>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-400">Дата заказа</div>
                                <div className="font-semibold text-gray-800 text-sm">
                                    {order.createdAt.split("T")[0].split("-")[2]}.
                                    {order.createdAt.split("T")[0].split("-")[1]}.
                                    {order.createdAt.split("T")[0].split("-")[0]}
                                </div>
                            </div>
                        </div>

                        {/* Имя */}
                        <div className="flex items-start gap-3">
                            <i className="bi bi-person text-gray-400 mt-0.5 shrink-0"></i>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-400">Имя получателя</div>
                                <div className="font-semibold text-gray-800 text-sm">{order.FIO}</div>
                            </div>
                        </div>

                        {/* Телефон */}
                        <div className="flex items-start gap-3">
                            <i className="bi bi-telephone text-gray-400 mt-0.5 shrink-0"></i>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-400">Телефон</div>
                                <div className="font-semibold text-gray-800 text-sm">
                                    {formatPhoneNumber(order.phone)}
                                </div>
                            </div>
                        </div>

                        {/* Тип отправки */}
                        <div className="flex items-start gap-3">
                            <i className="bi bi-box-seam text-gray-400 mt-0.5 shrink-0"></i>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-400">Способ отправки</div>
                                <div className="font-semibold text-gray-800 text-sm">{ShowPost()}</div>
                            </div>
                        </div>

                        {/* Город + индекс */}
                        <div className="flex items-start gap-3">
                            <i className="bi bi-building text-gray-400 mt-0.5 shrink-0"></i>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-400">Город</div>
                                <div className="font-semibold text-gray-800 text-sm">
                                    {order.city}
                                    {order.typePost === 'R' && order.postCode && `, ${order.postCode}`}
                                </div>
                            </div>
                        </div>

                        {/* Адрес */}
                        <div className="flex items-start gap-3">
                            <i className="bi bi-geo-alt text-gray-400 mt-0.5 shrink-0"></i>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-400">Адрес доставки</div>
                                <div className="font-semibold text-gray-800 text-sm">
                                    {order.adress}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </div>

                {/* === ПРАВАЯ КОЛОНКА: статус и сумма === */}
                <div className="space-y-3">

                    {/* Сумма заказа */}
                    <div className="bg-teal-50 rounded-lg p-3 border border-teal-100">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Сумма заказа</span>
                            <span className="text-base md:text-lg font-bold text-teal-900">
                                {Number(order.price).toFixed(2)} ₽
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                            <span>Пересылка</span>
                            <span className="font-medium">
                                {order.price_deliver === '0' ? 'нет данных' : `+${order.price_deliver} р`}
                            </span>
                        </div>
                    </div>

                    {/* Дата отправки */}
                    {(order.status > 0 && order.status <= 4 && order.date_sent) && (
                        <div className="bg-gray-50 rounded-lg p-3 flex flex-row justify-between">
                            <div className="text-xs text-gray-400 mb-1">Отправка ожидается</div>
                            <div className="font-semibold text-gray-800 text-sm">
                                {order.date_sent.split('-')[2]}.{order.date_sent.split('-')[1]}.{order.date_sent.split('-')[0]}
                            </div>
                        </div>
                    )}

                    

                    <div className="bg-gray-50 rounded-lg p-3 space-y-3">

                        {/* Строка статуса + этап */}
                        <div className="flex items-center justify-between gap-2">
                            <span className='font-light text-xs  text-black-900'>Статус:</span> 
                            <span className={`text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full ${order.status === 6 || order.status === 5
                                    ? 'bg-gray-200 text-gray-700'
                                    : order.status === 8
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-teal-100 text-teal-800'
                                }`}>
                                {StatusOrder[order.status]}
                            </span>

                            {/* Этап — только для статусов 0-5 (не для ошибки/ожидания) */}
                            {order.status >= 0 && order.status <= 5 && (
                                <span className="text-xs text-gray-500 font-medium">
                                    Этап <span className="text-teal-700 font-bold">{order.status + 1}</span> из 6
                                </span>
                            )}
                        </div>

                        {/* Прогресс-бар — только для статусов 0-6 */}
                        {order.status >= 0 && order.status <= 5 && (
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-teal-700 rounded-full transition-all duration-500"
                                    style={{ width: `${((order.status + 1) / 6) * 100}%` }}
                                />
                            </div>
                        )}

                        {/* Описание статуса */}
                        <div className="text-xs md:text-sm text-gray-700 leading-relaxed">
                            {MessageStatus[order.status]}
                        </div>
                    </div>



                    {/* Штрихкод */}
                    {order.status === 5 && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="text-xs text-gray-400">Штрихкод</div>
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg 
                                            text-xs font-mono text-gray-800 bg-white"
                                    value={order.codeOutside || '-'}
                                    readOnly
                                />
                                
                                {order.typePost === 'R' && (
                                    <button
                                        onClick={() => {
                                            if (order.codeOutside) {
                                                window.open(
                                                    `https://belpost.by/Otsleditotpravleniye?number=${order.codeOutside}`,
                                                    '_blank'
                                                );
                                            }
                                        }}
                                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-900 
                                                text-white rounded-lg text-xs font-medium 
                                                transition-colors whitespace-nowrap"
                                    >
                                        Отследить
                                    </button>
                                )}
                                {user.role !== 'USER' && (
                                    <CopyToClipboard text={textMessage()}>
                                        <button
                                            onClick={CopyCode}
                                            className="px-3 py-1.5 bg-white border border-gray-300 
                                                    hover:bg-gray-100 rounded-lg text-xs font-medium 
                                                    transition-colors whitespace-nowrap"
                                        >
                                            SMS {isCopy && <i className="bi bi-clipboard-check text-green-600"></i>}
                                        </button>
                                    </CopyToClipboard>
                                ) 
                                
                                }
                            </div>
                        </div>
                    )}

                    {/* Примечания */}
                    {order.other && (
                        <div className="space-y-1">
                            <div className="text-xs text-gray-400">Примечания</div>
                            <textarea
                                disabled
                                value={order.other}
                                rows={order.other.split('\n').length < 2 ? 2 : Math.min(order.other.split('\n').length, 6)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                        text-xs text-gray-700 bg-gray-50 resize-none cursor-not-allowed"
                            />
                        </div>
                    )}



                    {/* Для админа — расчёт LINK/прибыль */}
                    {user.role !== 'USER' && (
                        <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100 text-xs">
                            <div>
                                <span className="text-gray-500">LINK = </span>
                                <span className="font-semibold text-gray-800">{(SumTeor() * 0.8).toFixed(2)} ₽</span>
                            </div>
                            <div>
                                <span className="text-gray-500">💵 = </span>
                                <span className="font-semibold text-gray-800">
                                    {order.firstClass
                                        ? (-Number(order.price) - Number(order.price_deliver)).toFixed(2)
                                        : (Number(order.price) - SumTeor() * 0.8).toFixed(2)
                                    } ₽
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                </div>

                {/* === ФАЙЛЫ === */}
                <div className="border-t border-gray-100 p-4 md:p-5 space-y-2">
                    <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                        Файлы 
                    </div>
                    <div className="space-y-2">
                        {order.photos.map((el, index) => (
                            <OneOrderFile
                                key={index}
                                el={el}
                                status={order.status}
                                PriceList={PriceList}
                                settings={settings}
                            />
                        ))}
                    </div>
                </div>
            </div>
            :
<div
    onClick={handleDetailsClick}
    className="mb-2 w-full bg-white rounded-lg shadow-sm border border-gray-100
            hover:border-teal-200 hover:shadow-md cursor-pointer
            transition-all px-3 md:px-4 py-3
            grid items-center gap-2 md:gap-4
            grid-cols-[16px_minmax(0,1fr)_auto_auto]
            md:grid-cols-[20px_minmax(130px,1fr)_minmax(140px,1.4fr)_minmax(120px,1fr)_minmax(100px,0.9fr)_110px]
            text-xs md:text-sm font-semibold"
>
    {/* Стрелка */}
    <div className="shrink-0 flex justify-center">
        <i className="bi bi-caret-down-fill text-teal-700 text-base md:text-lg"></i>
    </div>

    {/* Дата заказа */}
    <div className="text-gray-600 font-medium whitespace-nowrap truncate">
        Заказ от{" "}
        {order.createdAt.split("T")[0].split("-")[2]}.
        {order.createdAt.split("T")[0].split("-")[1]}.
        {order.createdAt.split("T")[0].split("-")[0]}
    </div>

    {/* ФИО — только на десктопе */}
    <div className="hidden md:block min-w-0 truncate text-gray-800">
        {order.FIO}
    </div>

    {/* Город — только на десктопе */}
    <div className="hidden md:block min-w-0 truncate text-gray-500">
        {order.city}
    </div>

    {/* Сумма — только на десктопе */}
    <div className="hidden md:block font-semibold text-gray-800 whitespace-nowrap text-right">
        {(Number(order.price) + Number(order.price_deliver)).toFixed(2)} ₽
    </div>

    {/* Сумма для мобилки — показывается только на маленьком экране */}
    <div className="md:hidden font-semibold text-gray-800 whitespace-nowrap text-right">
        {(Number(order.price) + Number(order.price_deliver)).toFixed(2)} ₽
    </div>

    {/* Статус */}
    <div className="shrink-0 flex justify-end">
        <span
            className={`text-[10px] md:text-xs inline-flex items-center justify-center text-center font-medium 
                        px-2 py-1 rounded-full whitespace-nowrap min-w-[70px]
                        ${order.status === 6 || order.status === 5
                            ? 'bg-gray-200 text-gray-700'
                            : order.status === 8
                                ? 'bg-red-100 text-red-700'
                                : 'bg-teal-100 text-teal-800'
                        }`}
        >
            {StatusOrder[order.status]}
        </span>
    </div>
</div>

            }
    
        </>
    )
}