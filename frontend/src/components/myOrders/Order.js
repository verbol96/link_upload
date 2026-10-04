import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { deleteOrder } from '../../http/dbApi';
import { deleteFile } from '../../http/cloudApi';
import { deleteOrderId } from '../../store/orderReducer';
import { OrderFiles } from './OrderFiles';

const STATUS_ORDER=[
    'новый',
    'принят',
    'готов к печати',
    'в печати',
    'упакован',
    'отправлен',
    'получен',
    'в ожидании',
    'ошибка'
];

const getPostName=(typePost)=>{
    switch(typePost){
        case 'E': return 'Европочта (наложенный)';
        case 'E1': return 'Европочта (оплата ЕРИП)';
        case 'R1': return 'Письмо (оплата ЕРИП)';
        case 'R2': return 'Белпочта (оплата ЕРИП)';
        case 'R': return 'Белпочта (наложенный)';
        default: return 'Европочта';
    }
};

const formatDate=(date)=>{
    if(!date)return'—';

    const value=new Date(date);
    if(Number.isNaN(value.getTime()))return'—';

    return value.toLocaleDateString('ru-RU');
};

const formatPhone=(phone)=>{
    if(!phone)return'—';

    const cleaned=phone.replace(/\D/g,'');
    const match=cleaned.match(/^375(\d{2})(\d{3})(\d{2})(\d{2})$/);

    if(!match)return phone;

    return`+375 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
};

const getStatusClass=(status)=>{
    if(status===8)return'bg-red-100 text-red-700';
    if(status===5||status===6)return'bg-gray-200 text-gray-700';

    return'bg-teal-100 text-teal-800';
};

export const Order=({order,settings,priceList,expanded,onToggle})=>{
    const dispatch=useDispatch();
    const[showDelivery,setShowDelivery]=useState(false);

    const total=(Number(order.price||0)+Number(order.price_deliver||0)).toFixed(2);

    const deleteCurrentOrder=async()=>{
        if(!window.confirm('Вы уверены, что хотите удалить этот заказ?'))return;

        try{
            await deleteOrder(order.id);
            dispatch(deleteOrderId(order.id));

            if(order.main_dir_id){
                await deleteFile(order.main_dir_id);
            }
        }catch(error){
            console.error('Ошибка удаления заказа:',error);
        }
    };

    const getStatusMessage=()=>{
        switch(order.status){
            case 0:
                return (
                    <>
                        Заказ поступил нам и ожидает проверки сотрудником. В этом статусе вы ещё можете{' '}
                        <button
                            type="button"
                            onClick={deleteCurrentOrder}
                            className="text-red-600 hover:text-red-700 font-medium"
                        >
                            удалить заказ
                        </button>.
                    </>
                );
            case 1:
                return'Заказ проверен сотрудником. Сейчас подготавливаем файлы к печати.';
            case 2:
                return'Файлы подготовлены к печати. Заказ в очереди на печать.';
            case 3:
                return'Заказ сейчас находится на стадии печати.';
            case 4:
                return'Печать заказа завершена, заказ аккуратно упакован для безопасной пересылки.';
            case 5:
                return'Ваш заказ передан на отправку. По номеру отправления можете его отслеживать.';
            case 6:
                return'Спасибо за заказ. Будем рады помочь снова.';
            case 7:
                return'Заказ находится в ожидании. Возможные причины: ожидание оплаты, дня отправки или добавления фото.';
            case 8:
                return (
                    <>
                        Ошибка в заказе. Возможно, загрузились не все фотографии. Вы можете оформить заказ заново, а этот{' '}
                        <button
                            type="button"
                            onClick={deleteCurrentOrder}
                            className="text-red-600 hover:text-red-700 font-medium"
                        >
                            удалить
                        </button>.
                    </>
                );
            default:
                return'';
        }
    };

    const copyText=async(text,successMessage)=>{
        if(!text)return;

        try{
            await navigator.clipboard.writeText(text);

            toast.success(successMessage,{
                description:text,
                duration:2000
            });
        }catch(error){
            console.error('Ошибка копирования:',error);

            try{
                const textarea=document.createElement('textarea');
                textarea.value=text;
                textarea.style.position='fixed';
                textarea.style.opacity='0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);

                toast.success(successMessage,{
                    description:text,
                    duration:2000
                });
            }catch(fallbackError){
                console.error('Fallback тоже не сработал:',fallbackError);

                toast.error('Не удалось скопировать',{
                    description:'Скопируйте значение вручную'
                });
            }
        }
    };

    const copyInvoice=()=>{
        const invoiceNumber=`27307-1-${order.order_number}`;
        copyText(invoiceNumber,'Номер счёта скопирован');
    };

    const copyTrackingCode=()=>{
        copyText(order.codeOutside,'Код отправления скопирован');
    };

    if(!expanded){
        return (
            <button
                type="button"
                onClick={onToggle}
                className="w-full bg-white rounded-lg shadow-sm border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all px-3 md:px-4 py-3 grid items-center gap-2 md:gap-4 grid-cols-[16px_minmax(0,1fr)_auto_auto] md:grid-cols-[20px_minmax(130px,1fr)_minmax(140px,1.4fr)_minmax(120px,1fr)_minmax(100px,0.9fr)_110px] text-xs md:text-sm text-left"
            >
                <div className="flex justify-center">
                    <i className="bi bi-caret-down-fill text-teal-700 text-base md:text-lg"/>
                </div>

                <div className="text-gray-600 font-medium whitespace-nowrap truncate">
                    Заказ от {formatDate(order.createdAt)}
                </div>

                <div className="hidden md:block min-w-0 truncate font-semibold text-gray-800">
                    {order.FIO}
                </div>

                <div className="hidden md:block min-w-0 truncate text-gray-500">
                    {order.city}
                </div>

                <div className="hidden md:block font-semibold text-gray-800 whitespace-nowrap text-right">
                    {total} р
                </div>

                <div className="md:hidden font-semibold text-gray-800 whitespace-nowrap text-right">
                    {total} р
                </div>

                <div className="flex justify-end">
                    <span className={`text-[10px] md:text-xs inline-flex items-center justify-center text-center font-medium px-2 py-1 rounded-full whitespace-nowrap min-w-[70px] ${getStatusClass(order.status)}`}>
                        {STATUS_ORDER[order.status]||'неизвестно'}
                    </span>
                </div>
            </button>
        );
    }

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-teal-700 overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-4 px-4 md:px-5 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
            >
                <i className="bi bi-caret-up-fill text-teal-700 text-lg md:text-xl"/>

                <span className="text-sm md:text-base font-semibold text-gray-800">
                    Заказ от {formatDate(order.createdAt)}
                </span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5">
                <div>
                    <button
                        type="button"
                        onClick={()=>setShowDelivery(prev=>!prev)}
                        className="w-full flex items-center gap-3 px-3 md:px-4 py-3 bg-gray-100 border border-teal-900/50 rounded-xl text-left overflow-hidden"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                            <i className="bi bi-truck text-gray-700 text-sm"/>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">
                                Данные отправления
                            </div>

                            <div className="text-xs text-gray-500 truncate mt-0.5">
                                {order.FIO}
                            </div>
                        </div>

                        <i className={`bi ${showDelivery?'bi-caret-up-fill':'bi-caret-down-fill'} text-teal-700 text-lg shrink-0`}/>
                    </button>

                    {showDelivery&&(
                        <div className="p-3 md:p-4 space-y-3">
                            <OrderInfo
                                icon="bi-calendar"
                                label="Дата заказа"
                                value={formatDate(order.createdAt)}
                            />

                            <OrderInfo
                                icon="bi-person"
                                label="Имя получателя"
                                value={order.FIO}
                            />

                            <OrderInfo
                                icon="bi-telephone"
                                label="Телефон"
                                value={formatPhone(order.phone)}
                            />

                            <OrderInfo
                                icon="bi-box-seam"
                                label="Способ отправки"
                                value={getPostName(order.typePost)}
                            />

                            <OrderInfo
                                icon="bi-building"
                                label="Город"
                                value={`${order.city||'—'}${order.typePost==='R'&&order.postCode?`, ${order.postCode}`:''}`}
                            />

                            <OrderInfo
                                icon="bi-geo-alt"
                                label="Адрес доставки"
                                value={order.adress}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="bg-teal-600/5 rounded-lg p-3 ">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">
                                Сумма заказа
                            </span>

                            <span className="text-base md:text-lg font-semibold text-gray-800 ">
                                {Number(order.price||0).toFixed(2)} р
                            </span>
                        </div>

                        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                            <span className="text-xs text-gray-400">
                                Пересылка
                            </span>

                            <span className="font-normal text-gray-800 ">
                                {Number(order.price_deliver||0)===0
                                    ?'нет данных'
                                    :`+${Number(order.price_deliver).toFixed(2)} р`
                                }
                            </span>
                        </div>
                    </div>

                    {order.status>0&&order.status<=4&&order.date_sent&&(
                        <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between gap-3">
                            <span className="text-xs text-gray-400">
                                Отправка ожидается
                            </span>

                            <span className="font-semibold text-gray-800 text-sm">
                                {formatDate(order.date_sent)}
                            </span>
                        </div>
                    )}

                                        {(order.typePost==='R1'||order.typePost==='E1'||order.typePost==='R2')&&(
                        <div>
                            {order.isPayment==='paid'&&(
                                <div className="flex items-center justify-end gap-1.5 px-2.5 py-2 rounded-md
                                                text-[15px] font-medium w-full
                                                bg-teal-600/5 text-gray-600 mr-1">
                                    
                                    Заказ оплачен
                                    <i className="bi bi-check-lg text-green-700 text-[17px]"/>
                                </div>
                            )}

                            {order.isPayment==='wait'&&(
                                <div className="bg-teal-600/5 text-stone-900 rounded-lg p-3">
                                    <div className="flex items-center gap-2  font-medium text-[13px] mb-2">
                                        <i className="bi bi-clock-fill text-[12px]"/>
                                        Ожидает оплаты...
                                    </div>

                                    <div className="text-[12px] leading-relaxed">
                                        <div>
                                            ЕРИП → E-POS
                                        </div>

                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span>
                                                Номер счёта:{' '}
                                                <b className="font-mono tracking-wide">
                                                    27307-1-{order.order_number}
                                                </b>
                                            </span>

                                            <button
                                                type="button"
                                                onClick={copyInvoice}
                                                className="inline-flex items-center justify-center
                                                        w-6 h-6 rounded-md bg-white border
                                                        text-stone-900 hover:bg-amber-100
                                                        transition-colors"
                                                title="Скопировать номер счёта"
                                            >
                                                <i className="bi bi-clipboard text-[11px]"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-gray-100 rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-400">
                                Статус:
                            </span>

                            <span className={`text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full ${getStatusClass(order.status)}`}>
                                {STATUS_ORDER[order.status]||'неизвестно'}
                            </span>

                            {order.status>=0&&order.status<=5&&(
                                <span className="text-xs text-gray-500 font-medium">
                                    Этап <span className="text-teal-700 font-bold">{order.status+1}</span> из 6
                                </span>
                            )}
                        </div>

                        {order.status>=0&&order.status<=5&&(
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-teal-700 rounded-full transition-all duration-500"
                                    style={{width:`${((order.status+1)/6)*100}%`}}
                                />
                            </div>
                        )}

                        <div className="text-xs md:text-sm text-gray-700 leading-relaxed">
                            {getStatusMessage()}
                        </div>
                    </div>



                    {order.status===5&&(
                        <div className="bg-gray-100 rounded-lg p-3 space-y-2">
                            <div className="text-xs text-gray-400">
                                Номер для отслеживания
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    value={order.codeOutside||'-'}
                                    readOnly
                                    className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono text-gray-800 bg-white outline-none"
                                />

                                {order.codeOutside&&(
                                    <button
                                        type="button"
                                        onClick={copyTrackingCode}
                                        className="w-8 h-8 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                                        title="Скопировать код отправления"
                                    >
                                        <i className="bi bi-clipboard text-[12px]"/>
                                    </button>
                                )}

                                {order.typePost==='R'&&order.codeOutside&&(
                                    <button
                                        type="button"
                                        onClick={()=>{
                                            window.open(
                                                `https://belpost.by/Otsleditotpravleniye?number=${order.codeOutside}`,
                                                '_blank'
                                            );
                                        }}
                                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-900 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                                    >
                                        Отследить
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {order.other&&(
                        <div className="space-y-1 bg-teal-600/5 rounded-md p-3">
                            <div className="text-xs text-gray-400">
                                Примечания:
                            </div>

                            <div className="w-full  text-xs text-gray-700 whitespace-pre-wrap">
                                {order.other}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-gray-100 p-4 md:p-5">
                <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                    Файлы
                </div>

                <div className="space-y-2">
                    {(order.photos||[]).map(el=>(
                        <OrderFiles
                            key={el.id}
                            item={el}
                            status={order.status}
                            settings={settings}
                            priceList={priceList}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const OrderInfo=({icon,label,value})=>{
    return (
        <div className="flex items-start gap-3">
            <i className={`bi ${icon} text-gray-400 mt-0.5 shrink-0`}/>

            <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400">
                    {label}
                </div>

                <div className="font-semibold text-gray-800 text-sm break-words">
                    {value||'—'}
                </div>
            </div>
        </div>
    );
};