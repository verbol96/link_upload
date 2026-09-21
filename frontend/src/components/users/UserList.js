import { useEffect, useState } from "react"
import { $host } from "../../http";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle, DialogDescription
} from "../../ui/dialog";
import { Input } from "../../ui/input"
import { Button } from "../../ui/button"
import { Textarea } from "../../ui/textarea";

export const UserList = () => {

    const [data, setData] = useState([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [totalPage, setTotalPage] = useState(0)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [limit, setLimit] = useState(100)
    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState('createdAt-desc')

    // ===== Таб для модалки (только мобилка) =====
    const [mobileTab, setMobileTab] = useState('form');

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: debouncedSearch || undefined,
                sortBy: sort.split('-')[0],
                sortDir: sort.split('-')[1]
            };
            const response = await $host.get('api/auth/clients', { params });
            setData(response.data.data);
            setTotal(response.data.total)
            setTotalPage(response.data.totalPage)
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch, sort, limit])

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.toLowerCase());
            setPage(1);
        }, 800);

        return () => clearTimeout(timer);
    }, [search]);

    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [ordersModal, setOrdersModal] = useState([]);

    const handleRowDoubleClick = async (user) => {
        const { data } = await $host.get(`/api/order/ordersUser/${user.id}`)
        setOrdersModal(data)
        setSelectedUser(user);
        setFormData(user);
        setMobileTab('form');
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            await $host.put(`/api/auth/clientUpdate/${selectedUser.id}`, formData);
            const updatedData = data.map(user =>
                user.id === selectedUser.id ? formData : user
            );
            setData(updatedData);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    };

    // ============ УДАЛИТЬ КЛИЕНТА ============
    const handleDeleteClient = async () => {
        if (ordersModal.length > 0) return;

        const ok = window.confirm(
            `Удалить клиента?\n\n${selectedUser?.FIO || ''}\n${selectedUser?.phone || ''}`
        );
        if (!ok) return;

        try {
            await $host.delete(`/api/auth/usersDelete/${selectedUser.id}`);

            setData(prev => prev.filter(u => u.id !== selectedUser.id));
            setTotal(t => t - 1);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Ошибка удаления клиента:', error);
            window.alert('Не удалось удалить клиента');
        }
    };

    // ============ УДАЛИТЬ ЗАКАЗ ============
    const handleDeleteOrder = async (order) => {
        const ok = window.confirm(
            `Удалить заказ?\n\n№${order.order_number}\n${order.FIO}\nСумма: ${order.price} р`
        );
        if (!ok) return;

        try {
            await $host.delete(`/api/order/deleteOrder/${order.id}`);

            setOrdersModal(prev => prev.filter(o => o.id !== order.id));

            setData(prev => prev.map(u =>
                u.id === selectedUser.id
                    ? {
                        ...u,
                        orderCount: Math.max(0, (u.orderCount || 0) - 1),
                        totalOrderSum: Math.max(0, (u.totalOrderSum || 0) - Number(order.price || 0)),
                    }
                    : u
            ));

            setSelectedUser(prev => prev ? {
                ...prev,
                orderCount: Math.max(0, (prev.orderCount || 0) - 1),
                totalOrderSum: Math.max(0, (prev.totalOrderSum || 0) - Number(order.price || 0)),
            } : prev);

        } catch (error) {
            console.error('Ошибка удаления заказа:', error);
            window.alert('Не удалось удалить заказ');
        }
    };

    const photoLine = (data) => {
        return data.reduce((sum, el) => {
            if (el.paper === 'lustre') {
                return sum + el.amount * el.copies + "шт(" + el.format + ")ЛЮСТР "
            } else {
                return sum + el.amount * el.copies + "шт(" + el.format + ") "
            }
        }, '')
    }

    const [expandedOrder, setExpandedOrder] = useState(null);

    const toggleOrder = (orderNumber) => {
        setExpandedOrder(expandedOrder === orderNumber ? null : orderNumber);
    };

    return (
        <>
            <div className="h-full flex flex-col p-3 md:p-4 mx-auto">
                {/* Шапка */}
                <div className="flex flex-wrap gap-3 md:gap-5 md:justify-between md:items-center mb-4 md:mb-6 flex-shrink-0">
                    <h1 className="text-base font-semibold">Клиентов: {total}</h1>
                    <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm font-medium text-gray-600 hidden md:block">Отоброжать по:</h1>
                            <select className="px-3 py-1.5 border border-gray-300 rounded-base text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                style={{
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none'
                                }}
                                value={limit} onChange={e => setLimit(e.target.value)}
                            >
                                <option value="10">10</option>
                                <option value="18">18</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-1">
                            <h1 className="text-sm font-medium text-gray-600 hidden md:block">Сортировать по:</h1>
                            <select className="px-3 py-1.5 border border-gray-300 rounded-base text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                style={{
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none'
                                }}
                                value={sort} onChange={e => setSort(e.target.value)}
                            >
                                <option value="FIO-asc">Имени ↑</option>
                                <option value="createdAt-asc">Дате регистрации ↑</option>
                                <option value="orderCount-asc">Количеству заказов ↑</option>
                                <option value="totalOrderSum-asc">Сумме заказов ↑</option>
                                <option value="FIO-desc">Имени ↓</option>
                                <option value="createdAt-desc">Дате регистрации ↓</option>
                                <option value="orderCount-desc">Количеству заказов ↓</option>
                                <option value="totalOrderSum-desc">Сумме заказов ↓</option>
                            </select>
                        </div>

                        <input
                            className="px-4 py-1.5 border rounded-lg flex-1 min-w-[140px] md:w-64 md:flex-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Поиск..."
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border-t border-b border-gray-200 rounded-sm p-1">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-1 text-center text-gray-500">
                                            Загрузка...
                                        </td>
                                    </tr>
                                ) : (
                                    data.map(client => (
                                        <tr key={client.id} className="hover:bg-gray-50" onDoubleClick={() => handleRowDoubleClick(client)}>
                                            <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.FIO}</td>
                                            <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.phone}</td>
                                            <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.role}</td>
                                            <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.orderCount}</td>
                                            <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.totalOrderSum}</td>
                                            <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.city}</td>
                                            <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.adress}</td>
                                            <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px] text-gray-600">
                                                {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                                            </td>
                                            <td className={`px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px] ${client.lastOrderDate?.split('.')[2] === '2026' ? 'text-blue-600' : 'text-gray-600'
                                                }`}>
                                                {client.lastOrderDate}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Пагинация */}
                <div className="flex items-center justify-between mt-4 md:mt-6 flex-shrink-0 gap-3 flex-wrap">
                    <div className="text-sm text-gray-600">
                        Страница {page} из {totalPage}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 1}
                            className="px-3 md:px-4 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            ← Назад
                        </button>

                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page === totalPage}
                            className="px-3 md:px-4 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Вперед →
                        </button>
                    </div>
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent
                    className="max-w-[95%] md:max-w-[90%] w-full h-[90vh] p-0 flex flex-col overflow-hidden"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="px-4 md:px-5 py-3 ">
                        <DialogHeader>
                            <DialogTitle className='text-[15px] md:text-[16px]'>Редактирование клиента</DialogTitle>
                            <DialogDescription className="sr-only">
                                Форма редактирования данных клиента
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* ===== Табы — только на телефоне ===== */}
                    <div className="md:hidden flex gap-1 mx-3 mt-3 p-1 bg-gray-100 rounded-lg shrink-0">
                        <button
                            onClick={() => setMobileTab('form')}
                            className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-colors
                                ${mobileTab === 'form'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600'
                                }`}
                        >
                            <i className="bi bi-person mr-1.5"></i>
                            Данные
                        </button>
                        <button
                            onClick={() => setMobileTab('orders')}
                            className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-colors
                                ${mobileTab === 'orders'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600'
                                }`}
                        >
                            <i className="bi bi-receipt mr-1.5"></i>
                            Заказы {ordersModal.length > 0 && `(${ordersModal.length})`}
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 md:gap-3 overflow-hidden md:mx-4 md:mb-4">
                        <div className={`
                            flex-col w-full md:flex-1 bg-gray-100 p-3 md:rounded-md
                            overflow-y-auto
                            md:border-b-0 border-gray-200
                            shrink-0
                            md:flex md:flex-col
                            ${mobileTab === 'form' ? 'flex flex-1 min-h-0' : 'hidden'}
                        `}>
                            <div className="">
                                <label className="text-sm font-medium">ФИО</label>
                                <Input
                                    name="FIO"
                                    value={formData.FIO || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="">
                                <label className="text-sm font-medium">Телефон</label>
                                <Input
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="">
                                <label className="text-sm font-medium">Роль</label>
                                <Input
                                    name="role"
                                    value={formData.role || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="">
                                <label className="text-sm font-medium">Тип почты</label>
                                <Input
                                    name="typePost"
                                    value={formData.typePost || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="">
                                <label className="text-sm font-medium">Индекс</label>
                                <Input
                                    name="postCode"
                                    value={formData.postCode || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="s">
                                <label className="text-sm font-medium">Город</label>
                                <Input
                                    name="city"
                                    value={formData.city || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="">
                                <label className="text-sm font-medium">Адрес</label>
                                <Input
                                    name="adress"
                                    value={formData.adress || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium">О клиенте</label>
                                <Textarea
                                    name="aboutUser"
                                    value={formData.aboutUser || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button className='mt-4 flex-1 md:flex-none' onClick={handleSave}>
                                    Сохранить
                                </Button>

                                <Button
                                    className='mt-4 flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white
                                               disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed'
                                    onClick={handleDeleteClient}
                                    disabled={ordersModal.length > 0}
                                    title={ordersModal.length > 0
                                        ? `Нельзя удалить: у клиента ${ordersModal.length} заказ(ов)`
                                        : 'Удалить клиента'}
                                >
                                    <i className="bi bi-trash3 mr-1"></i>
                                    Удалить
                                </Button>
                            </div>

                        </div>

                        <div className={`
                            flex-1 min-h-0 h-full
                            md:flex
                            ${mobileTab === 'orders' ? 'flex' : 'hidden'}
                        `}>
                            <div className="flex flex-col w-full h-full">

                                <div className="flex-1 overflow-auto bg-white md:rounded-md border border-gray-200">
                                    <div className="w-full text-sm min-w-[700px]">
                                        {/* Заголовки */}
                                        <div className="sticky bg-white top-0 border-b flex font-semibold text-gray-500 text-[11px] uppercase tracking-wider z-10">
                                            <div className="flex-1 py-2 px-3">Дата</div>
                                            <div className="flex-1 py-2 px-3">ФИО</div>
                                            <div className="flex-1 py-2 px-3">Город</div>
                                            <div className="flex-1 py-2 px-3">Тип</div>
                                            <div className="flex-1 py-2 px-3">Заказ</div>
                                            <div className="flex-1 py-2 px-3 text-right">Сумма</div>
                                            <div className="flex-1 py-2 px-3">Источник</div>
                                        </div>

                                        {ordersModal.length === 0 ? (
                                            <div className="py-10 text-center text-gray-400">
                                                Заказов нет
                                            </div>
                                        ) : (
                                            ordersModal.map((el) => (
                                                <div key={el.order_number}>
                                                    {/* Строка */}
                                                    <div
                                                        className={`flex border-b cursor-pointer transition-colors
                                                            ${expandedOrder === el.order_number
                                                                ? 'bg-blue-50/70'
                                                                : 'hover:bg-gray-100'
                                                            }`}
                                                        onClick={() => toggleOrder(el.order_number)}
                                                    >
                                                        <div className="flex-1 py-2 px-3 text-gray-600 tabular-nums">
                                                            {new Date(el.createdAt).toLocaleDateString('ru-RU')}
                                                        </div>
                                                        <div className="flex-1 py-2 px-3 truncate text-gray-800">{el.FIO}</div>
                                                        <div className="flex-1 py-2 px-3 truncate text-gray-600">{el.city}</div>
                                                        <div className="flex-1 py-2 px-3 text-gray-600">{el.typePost}</div>
                                                        <div className="flex-1 py-2 px-3 truncate text-gray-600">{photoLine(el.photos)}</div>
                                                        <div className="flex-1 py-2 px-3 text-right font-semibold text-gray-800 tabular-nums">
                                                            {el.price} <span className="text-gray-400 font-normal text-[11px]">р</span>
                                                        </div>
                                                        <div className="flex-1 py-2 px-3 text-gray-600">{el.origin}</div>
                                                    </div>

                                                    {/* Раскрывающийся блок */}
                                                    {expandedOrder === el.order_number && (
                                                        <div className="bg-gray-50 p-4 border-b border-gray-200">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
                                                                <Detail label="ФИО" value={el.FIO} />
                                                                <Detail label="Телефон" value={el.phone} />
                                                                <Detail label="Город" value={el.city} />
                                                                <Detail label="Адрес" value={el.adress} />
                                                                <Detail label="Код" value={el.codeOutside} />
                                                                <Detail label="Заметки" value={el.notes} />
                                                                <Detail label="Примечания" value={el.other} />
                                                                <Detail label="Фото" value={photoLine(el.photos)} />
                                                                <Detail label="Цена" value={`${el.price} р + ${el.price_deliver} р`} />
                                                            </div>

                                                            {/* Кнопка удаления заказа */}
                                                            <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteOrder(el);
                                                                    }}
                                                                    className="inline-flex items-center gap-1.5
                                                                               px-3 py-1.5 rounded-md
                                                                               text-[12.5px] font-medium
                                                                               bg-white border border-red-200 text-red-600
                                                                               hover:bg-red-50 hover:border-red-300
                                                                               transition-colors"
                                                                >
                                                                    <i className="bi bi-trash3 text-[12px]"></i>
                                                                    Удалить заказ
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className='flex flex-row justify-end gap-5 mt-3 text-sm bg-gray-100 w-full py-1 px-5 rounded-md'>
                                    <label className=''> Всего заказов: {selectedUser?.orderCount || '0'} шт</label>
                                    <label className=''>Сумма заказов: {selectedUser?.totalOrderSum || '0'} р</label>
                                </div>

                            </div>
                        </div>
                    </div>

                </DialogContent>
            </Dialog>
        </>
    )
}

// ============ МАЛЕНЬКИЙ КОМПОНЕНТ ДЛЯ ДЕТАЛЕЙ В РАСКРЫТОМ БЛОКЕ ============
const Detail = ({ label, value }) => (
    <div className="flex gap-2">
        <span className="text-gray-400 shrink-0 min-w-[110px]">{label}:</span>
        <span className="text-gray-700 break-words">{value || '—'}</span>
    </div>
);