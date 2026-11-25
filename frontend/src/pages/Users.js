import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { $host } from "../http";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

import { NavBar } from "../components/admin/NavBar";

// ============ РОЛИ ============
const ROLE_OPTIONS = [
    { value: 'USER',    label: 'Клиент' },
    { value: 'PARTNER', label: 'Партнёр' },
    { value: 'WORKER',  label: 'Сотрудник' },
    { value: 'ADMIN',   label: 'Администратор' },
];

const Users = () => {
    const user = useSelector((state) => state.private.user);

    // WORKER не видит и не редактирует роль, и не фильтрует по ней
    const canSeeRole = user?.role === 'ADMIN';

    // ============ СОСТОЯНИЕ ============
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPage, setTotalPage] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [limit, setLimit] = useState(100);
    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState('createdAt-desc');
    const [roleFilter, setRoleFilter] = useState('all');

    const [mobileTab, setMobileTab] = useState('form');

    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [ordersModal, setOrdersModal] = useState([]);
    const [expandedOrder, setExpandedOrder] = useState(null);

    // ============ ЗАГРУЗКА ============
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: debouncedSearch || undefined,
                sortBy: sort.split('-')[0],
                sortDir: sort.split('-')[1],
                role: roleFilter !== 'all' ? roleFilter : undefined,
            };
            const response = await $host.get('api/auth/clients', { params });
            setData(response.data.data);
            setTotal(response.data.total);
            setTotalPage(response.data.totalPage);
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch, sort, limit, roleFilter]);

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.toLowerCase());
            setPage(1);
        }, 800);

        return () => clearTimeout(timer);
    }, [search]);

    // Сброс страницы при смене фильтра роли
    useEffect(() => {
        setPage(1);
    }, [roleFilter]);

    // ============ ОТКРЫТИЕ КАРТОЧКИ ============
    const handleRowDoubleClick = async (client) => {
        const { data } = await $host.get(`api/order/ordersUser/${client.id}`);
        setOrdersModal(data);
        setSelectedUser(client);
        setFormData(client);
        setMobileTab('form');
        setExpandedOrder(null);
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // ============ СОХРАНЕНИЕ ============
    const handleSave = async () => {
        try {
            // Формируем payload — role только для ADMIN
            const payload = { ...formData };
            if (!canSeeRole) {
                delete payload.role;
            }

            await $host.put(`api/auth/clientUpdate/${selectedUser.id}`, payload);

            const updatedData = data.map((u) =>
                u.id === selectedUser.id ? { ...u, ...payload } : u
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
            await $host.delete(`api/auth/usersDelete/${selectedUser.id}`);
            setData((prev) => prev.filter((u) => u.id !== selectedUser.id));
            setTotal((t) => t - 1);
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
            await $host.delete(`api/order/deleteOrder/${order.id}`);

            setOrdersModal((prev) => prev.filter((o) => o.id !== order.id));

            setData((prev) =>
                prev.map((u) =>
                    u.id === selectedUser.id
                        ? {
                            ...u,
                            orderCount: Math.max(0, (u.orderCount || 0) - 1),
                            totalOrderSum: Math.max(0, (u.totalOrderSum || 0) - Number(order.price || 0)),
                        }
                        : u
                )
            );

            setSelectedUser((prev) =>
                prev
                    ? {
                        ...prev,
                        orderCount: Math.max(0, (prev.orderCount || 0) - 1),
                        totalOrderSum: Math.max(0, (prev.totalOrderSum || 0) - Number(order.price || 0)),
                    }
                    : prev
            );
        } catch (error) {
            console.error('Ошибка удаления заказа:', error);
            window.alert('Не удалось удалить заказ');
        }
    };

    const photoLine = (photos) => {
        return photos.reduce((sum, el) => {
            if (el.paper === 'lustre') {
                return sum + el.amount * el.copies + 'шт(' + el.format + ')ЛЮСТР ';
            } else {
                return sum + el.amount * el.copies + 'шт(' + el.format + ') ';
            }
        }, '');
    };

    const toggleOrder = (orderNumber) => {
        setExpandedOrder(expandedOrder === orderNumber ? null : orderNumber);
    };

    return (
        <div className="h-screen flex flex-col bg-[#FAFBFD] text-[#334155]">
            <NavBar />

            <div className="mx-auto w-[90%] flex-1 min-h-0  flex flex-col p-3 md:p-5 max-w-[1800px]">

                {/* ============ ПАНЕЛЬ ФИЛЬТРОВ ============ */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4 shrink-0">

                    {/* Заголовок */}
                    <h1 className="text-[15px] md:text-[16px] font-semibold text-[#274C77] whitespace-nowrap">
                        Клиенты <span className="text-[#94A3B8] font-normal">· {total}</span>
                    </h1>



                    {/* === Селекты — прижаты к правому краю === */}
                    <div className="flex items-center gap-2 md:gap-3 ml-auto">
                    {/* Поиск — короткий */}
                    <div className="relative w-[180px] md:w-[220px]">
                        <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2
                                    text-[12px] text-[#94A3B8] pointer-events-none" />
                        <input
                            className="w-full pl-9 pr-3 py-1.5
                                    bg-white border border-[#DCE5EE] rounded-lg
                                    text-[13px] text-[#334155]
                                    placeholder:text-[#94A3B8]
                                    focus:outline-none focus:border-[#7890A8] focus:ring-2 focus:ring-[#7890A8]/20
                                    transition-colors"
                            placeholder="Поиск..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                        {/* Роль — только для ADMIN */}
                        {canSeeRole && (
                            <div className="relative">
                                <select
                                    className="appearance-none
                                            pl-3 pr-8 py-1.5
                                            bg-white border border-[#DCE5EE] rounded-lg
                                            text-[13px] font-medium text-[#334155]
                                            focus:outline-none focus:border-[#7890A8] focus:ring-2 focus:ring-[#7890A8]/20
                                            cursor-pointer transition-colors"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="all">Все роли</option>
                                    {ROLE_OPTIONS.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                                <i className="bi bi-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2
                                            text-[10px] text-[#94A3B8] pointer-events-none" />
                            </div>
                        )}

                        {/* Лимит */}
                        <div className="relative">
                            <select
                                className="appearance-none
                                        pl-3 pr-8 py-1.5
                                        bg-white border border-[#DCE5EE] rounded-lg
                                        text-[13px] font-medium text-[#334155]
                                        focus:outline-none focus:border-[#7890A8] focus:ring-2 focus:ring-[#7890A8]/20
                                        cursor-pointer transition-colors"
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                            >
                                <option value="10">10</option>
                                <option value="18">18</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <i className="bi bi-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2
                                        text-[10px] text-[#94A3B8] pointer-events-none" />
                        </div>

                        {/* Сортировка */}
                        <div className="relative">
                            <select
                                className="appearance-none
                                        pl-3 pr-8 py-1.5
                                        bg-white border border-[#DCE5EE] rounded-lg
                                        text-[13px] font-medium text-[#334155]
                                        focus:outline-none focus:border-[#7890A8] focus:ring-2 focus:ring-[#7890A8]/20
                                        cursor-pointer transition-colors"
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                            >
                                <option value="FIO-asc">Имя ↑</option>
                                <option value="FIO-desc">Имя ↓</option>
                                <option value="createdAt-asc">Дата ↑</option>
                                <option value="createdAt-desc">Дата ↓</option>
                                <option value="orderCount-asc">Заказов ↑</option>
                                <option value="orderCount-desc">Заказов ↓</option>
                                <option value="totalOrderSum-asc">Сумма ↑</option>
                                <option value="totalOrderSum-desc">Сумма ↓</option>
                            </select>
                            <i className="bi bi-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2
                                        text-[10px] text-[#94A3B8] pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* ============ ТАБЛИЦА ============ */}
                <div className="flex-1 min-h-0 overflow-auto ">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse text-[12px]">
                            <tbody className="divide-y divide-[#E8EEF4]">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="px-6  py-1 text-center text-[#64748B]">
                                            Загрузка...
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((client) => (
                                        <tr
                                            key={client.id}
                                            className="hover:bg-[#E9EEF3] bg-white cursor-pointer transition-colors duration-100"
                                            onDoubleClick={() => handleRowDoubleClick(client)}
                                            title="Двойной клик — открыть карточку"
                                        >
                                            <td className="px-3 md:px-4 py-2 text-[12px] overflow-hidden whitespace-nowrap text-ellipsis max-w-[180px]">
                                                {client.FIO}
                                            </td>
                                            <td className="px-3 md:px-4 py-2 text-[12px] overflow-hidden whitespace-nowrap text-ellipsis max-w-[180px]">
                                                {client.phone}
                                            </td>

                                            {/* Роль — только для ADMIN */}
                                            {canSeeRole && (
                                                <td className="px-3 md:px-4 py-2 text-[12px] overflow-hidden whitespace-nowrap text-ellipsis max-w-[180px]">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded
                                                        text-[11px] font-medium
                                                        ${client.role === 'ADMIN'
                                                            ? 'bg-[#E6F1F5] text-[#274C77]'
                                                            : client.role === 'WORKER'
                                                                ? 'bg-[#EAF0FA] text-[#375C90]'
                                                                : client.role === 'PARTNER'
                                                                    ? 'bg-[#FFF3DA] text-[#9A6418]'
                                                                    : 'bg-[#F1F5F9] text-[#64748B]'
                                                        }`}>
                                                        {ROLE_OPTIONS.find(r => r.value === client.role)?.label || client.role}
                                                    </span>
                                                </td>
                                            )}

                                            <td className="px-3 md:px-4 py-2 text-[12px] overflow-hidden whitespace-nowrap text-ellipsis max-w-[180px]">
                                                {client.orderCount}
                                            </td>
                                            <td className="px-3 md:px-4 py-2 text-[12px] overflow-hidden whitespace-nowrap text-ellipsis max-w-[180px]">
                                                {client.totalOrderSum}
                                            </td>
                                            <td className="px-3 md:px-4 py-2 text-[12px] overflow-hidden whitespace-nowrap text-ellipsis max-w-[180px]">
                                                {client.city}
                                            </td>
                                            <td className="px-3 md:px-4 py-2 text-[12px] overflow-hidden whitespace-nowrap text-ellipsis max-w-[180px]">
                                                {client.adress}
                                            </td>
                                            <td className="px-3 md:px-4 py-2 text-[12px] overflow-hidden whitespace-nowrap text-ellipsis max-w-[180px] text-[#64748B]">
                                                {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                                            </td>
                                            <td
                                                className={`px-3 md:px-4 py-2 text-[12px] overflow-hidden whitespace-nowrap text-ellipsis max-w-[180px] ${
                                                    client.lastOrderDate?.split('.')[2] === '2026'
                                                        ? 'text-blue-600'
                                                        : 'text-[#64748B]'
                                                }`}
                                            >
                                                {client.lastOrderDate}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ============ ПАГИНАЦИЯ ============ */}
                <div className="flex items-center justify-between mt-3 md:mt-4 flex-shrink-0 gap-3 flex-wrap">
                    <div className="text-sm text-[#64748B]">
                        Страница {page} из {totalPage}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => p - 1)}
                            disabled={page === 1}
                            className="px-3 md:px-4 py-2 border border-[#DCE5EE] bg-white rounded-lg text-[12px] text-[#274C77]
                                    disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F1F5F9]"
                        >
                            ← Назад
                        </button>

                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page === totalPage}
                            className="px-3 md:px-4 py-2 border border-[#DCE5EE] bg-white rounded-lg text-[12px] text-[#274C77]
                                    disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F1F5F9]"
                        >
                            Вперёд →
                        </button>
                    </div>
                </div>
            </div>

            {/* ============ МОДАЛКА ============ */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent
                    className="max-w-[95%] md:max-w-[90%] w-full h-[90vh] p-0 flex flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="px-4 md:px-5 py-3 border-b border-[#E8EEF4]">
                        <DialogHeader>
                            <DialogTitle className="text-[15px] md:text-[16px] text-[#274C77]">
                                Редактирование клиента
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Форма редактирования данных клиента
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* ===== Табы — только на телефоне ===== */}
                    <div className="md:hidden flex gap-1 mx-3 mt-3 p-1 bg-[#EDF2F7] rounded-lg shrink-0">
                        <button
                            onClick={() => setMobileTab('form')}
                            className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-colors
                                ${mobileTab === 'form' ? 'bg-white text-gray-900 shadow-sm' : 'text-[#64748B]'}`}
                        >
                            <i className="bi bi-person mr-1.5"></i>
                            Данные
                        </button>
                        <button
                            onClick={() => setMobileTab('orders')}
                            className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-colors
                                ${mobileTab === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-[#64748B]'}`}
                        >
                            <i className="bi bi-receipt mr-1.5"></i>
                            Заказы {ordersModal.length > 0 && `(${ordersModal.length})`}
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 overflow-hidden md:mx-4 md:mb-4">

                        {/* ===== ЛЕВАЯ КОЛОНКА: ФОРМА ===== */}
                        <div
                            className={`
                                flex-col w-full md:max-w-[300px] md:flex-shrink-0
                                bg-[#F6F9FC] border border-[#E2E8F0] p-3 md:rounded-lg
                                overflow-y-auto
                                shrink-0
                                md:flex md:flex-col
                                ${mobileTab === 'form' ? 'flex flex-1 min-h-0' : 'hidden'}
                            `}
                        >
                            <div>
                                <label className="text-[12px] font-medium text-[#475569]">ФИО</label>
                                <Input
                                    name="FIO"
                                    value={formData.FIO || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="text-[12px] font-medium text-[#475569]">Телефон</label>
                                <Input
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Роль — только для ADMIN, выпадающий список */}
                            {canSeeRole && (
                                <div>
                                    <label className="text-[12px] font-medium text-[#475569]">Роль</label>
                                    <select
                                        name="role"
                                        value={formData.role || 'USER'}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 mt-1
                                                bg-white border border-[#E2E8F0] rounded-md
                                                text-[14px] text-[#274C77]
                                                focus:outline-none focus:ring-2 focus:ring-[#7890A8]/30 focus:border-[#7890A8]
                                                cursor-pointer"
                                    >
                                        {ROLE_OPTIONS.map((r) => (
                                            <option key={r.value} value={r.value}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-[12px] font-medium text-[#475569]">Тип почты</label>
                                <Input
                                    name="typePost"
                                    value={formData.typePost || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="text-[12px] font-medium text-[#475569]">Индекс</label>
                                <Input
                                    name="postCode"
                                    value={formData.postCode || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="text-[12px] font-medium text-[#475569]">Город</label>
                                <Input
                                    name="city"
                                    value={formData.city || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="text-[12px] font-medium text-[#475569]">Адрес</label>
                                <Input
                                    name="adress"
                                    value={formData.adress || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-[12px] font-medium text-[#475569]">О клиенте</label>
                                <Textarea
                                    name="aboutUser"
                                    value={formData.aboutUser || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button className="mt-4 flex-1 md:flex-none bg-[#274C77] hover:bg-[#1D3D61] text-white" onClick={handleSave}>
                                    Сохранить
                                </Button>

                                <Button
                                    className="mt-4 flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white
                                            disabled:bg-gray-300 disabled:text-[#64748B] disabled:cursor-not-allowed"
                                    onClick={handleDeleteClient}
                                    disabled={ordersModal.length > 0}
                                    title={
                                        ordersModal.length > 0
                                            ? `Нельзя удалить: у клиента ${ordersModal.length} заказ(ов)`
                                            : 'Удалить клиента'
                                    }
                                >
                                    <i className="bi bi-trash3 mr-1"></i>
                                    Удалить
                                </Button>
                            </div>
                        </div>

                        {/* ===== ПРАВАЯ КОЛОНКА: ЗАКАЗЫ ===== */}
                        <div
                            className={`
                                flex-1 md:flex-1 md:min-w-0 min-h-0 h-full
                                md:flex
                                ${mobileTab === 'orders' ? 'flex' : 'hidden'}
                            `}
                        >
                            <div className="flex flex-col w-full h-full">
                                <div className="flex-1 overflow-auto bg-white md:rounded-lg border border-[#E2E8F0]">
                                    <div className="w-full text-sm min-w-[700px]">
                                        {/* Заголовки */}
                                        <div className="sticky bg-[#F8FAFC] top-0 border-b border-[#E2E8F0] flex font-semibold text-[#64748B] text-[11px] uppercase tracking-wider z-10">
                                            <div className="flex-1 py-2 px-3">Дата</div>
                                            <div className="flex-1 py-2 px-3">ФИО</div>
                                            <div className="flex-1 py-2 px-3">Город</div>
                                            <div className="flex-1 py-2 px-3">Тип</div>
                                            <div className="flex-1 py-2 px-3">Заказ</div>
                                            <div className="flex-1 py-2 px-3 text-right">Сумма</div>
                                            <div className="flex-1 py-2 px-3">Источник</div>
                                        </div>

                                        {ordersModal.length === 0 ? (
                                            <div className="py-10 text-center text-[#94A3B8]">
                                                Заказов нет
                                            </div>
                                        ) : (
                                            ordersModal.map((el) => (
                                                <div key={el.order_number}>
                                                    {/* Строка */}
                                                    <div
                                                        className={`flex border-b border-[#E8EEF4] cursor-pointer transition-colors
                                                            ${expandedOrder === el.order_number
                                                                ? 'bg-[#EAF1F7]'
                                                                : 'hover:bg-[#F1F5F9]'
                                                            }`}
                                                        onClick={() => toggleOrder(el.order_number)}
                                                    >
                                                        <div className="flex-1 py-2 px-3 text-[#64748B] tabular-nums">
                                                            {new Date(el.createdAt).toLocaleDateString('ru-RU')}
                                                        </div>
                                                        <div className="flex-1 py-2 px-3 truncate text-[#334155]">
                                                            {el.FIO}
                                                        </div>
                                                        <div className="flex-1 py-2 px-3 truncate text-[#64748B]">
                                                            {el.city}
                                                        </div>
                                                        <div className="flex-1 py-2 px-3 text-[#64748B]">
                                                            {el.typePost}
                                                        </div>
                                                        <div className="flex-1 py-2 px-3 truncate text-[#64748B]">
                                                            {photoLine(el.photos)}
                                                        </div>
                                                        <div className="flex-1 py-2 px-3 text-right font-semibold text-[#334155] tabular-nums">
                                                            {el.price}{' '}
                                                            <span className="text-[#94A3B8] font-normal text-[11px]">р</span>
                                                        </div>
                                                        <div className="flex-1 py-2 px-3 text-[#64748B]">
                                                            {el.origin}
                                                        </div>
                                                    </div>

                                                    {/* Раскрывающийся блок */}
                                                    {expandedOrder === el.order_number && (
                                                        <div className="bg-[#F8FAFC] p-4 border-b border-[#E2E8F0]">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
                                                                <Detail label="ФИО" value={el.FIO} />
                                                                <Detail label="Телефон" value={el.phone} />
                                                                <Detail label="Город" value={el.city} />
                                                                <Detail label="Адрес" value={el.adress} />
                                                                <Detail label="Код" value={el.codeOutside} />
                                                                <Detail label="Заметки" value={el.notes} />
                                                                <Detail label="Примечания" value={el.other} />
                                                                <Detail label="Фото" value={photoLine(el.photos)} />
                                                                <Detail
                                                                    label="Цена"
                                                                    value={`${el.price} р + ${el.price_deliver} р`}
                                                                />
                                                            </div>

                                                            {/* Кнопка удаления заказа */}
                                                            <div className="flex justify-end mt-3 pt-3 border-t border-[#E2E8F0]">
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

                                <div className="flex flex-row justify-end gap-5 mt-3 text-[12px] text-[#475569] bg-[#F1F5F9] border border-[#E2E8F0] w-full py-2 px-4 rounded-lg">
                                    <label>Всего заказов: {selectedUser?.orderCount || '0'} шт</label>
                                    <label>Сумма заказов: {selectedUser?.totalOrderSum || '0'} р</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// ============ ДЕТАЛИ В РАСКРЫТОМ БЛОКЕ ============
const Detail = ({ label, value }) => (
    <div className="flex gap-2">
        <span className="text-[#94A3B8] shrink-0 min-w-[110px]">{label}:</span>
        <span className="text-[#475569] break-words">{value || '—'}</span>
    </div>
);

export default Users;