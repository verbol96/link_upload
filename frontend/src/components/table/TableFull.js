
import { React, useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import _ from 'lodash'
import { $host } from '../../http/index'
import { TableRow } from './TableRow'
import { addOrder, saveOrders, saveSettings, saveUsers } from '../../store/orderReducer'
import { TableFooter } from './TableFooter'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog'
import Papa from 'papaparse'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'

const OrdersSkeleton = ({ rows = 10 }) => {
    return (
        <div className="px-2 pt-3">
            <div className="flex flex-col gap-1.5">
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-wrap md:flex-nowrap items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-3"
                        style={{
                            animation: 'fadeIn 0.4s ease-out both',
                            animationDelay: `${i * 60}ms`
                        }}
                    >
                        <div className="h-3 w-20 animate-pulse rounded bg-stone-200" />
                        <div className="h-3 w-32 animate-pulse rounded bg-stone-200" />
                        <div className="h-3 flex-1 animate-pulse rounded bg-stone-200" />
                        <div className="h-3 w-20 animate-pulse rounded bg-stone-200" />
                        <div className="h-3 w-24 animate-pulse rounded bg-stone-200" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export const TableFull = ({ selectedOrder, setSelectedOrder, collapsedOrderId, setCollapsedOrderId, handleDetailsClick, isChanged, setIsChanged, descRowRef }) => {
    const dispach = useDispatch()
    const user = useSelector(state => state.private.user)
    const userRole = user?.role || 'GUEST'
    const isAdmin = userRole === 'ADMIN'

    const [sortKey, setSortKey] = useState('default')
    const [activeProductFilter, setActiveProductFilter] = useState(null)
    const onlyGlossy = activeProductFilter === 'glossy'
    const onlyLustre = activeProductFilter === 'lustre'
    const onlyHolst = activeProductFilter === 'holst'
    const onlyMagnit = activeProductFilter === 'magnit'
    const onlyA4 = activeProductFilter === 'A4'
    const onlyPoster = activeProductFilter === 'poster'
    const toggleProductFilter = type => setActiveProductFilter(prev => prev === type ? null : type)
    const [datePickerOpen, setDatePickerOpen] = useState(false)
    const datePickerRef = useRef(null)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    let orders = _.orderBy(_.orderBy(useSelector(state => state.order.order), 'createdAt', 'desc'), 'status', 'asc')

    if (isAdmin && sortKey === 'price') orders = _.orderBy(orders, item => Number(item.price) || 0, 'desc')

    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)

        $host.get('api/order/getAll')
            .then(res => {
                dispach(saveOrders(res.data.orders))
                dispach(saveSettings(res.data.settings))
                dispach(saveUsers(res.data.users))
            })
            .catch(err => {
                console.error('Ошибка загрузки заказов:', err)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [dispach])

    const [searchQuery, setSearchQuery] = useState('')
    const [selectedType, setSelectedType] = useState('All')

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
    }

    const handleSelectChange = (e) => {
        setSelectedType(e.target.value)
    }


    const AddNewOrder = async () => {
        const data = {
            FIO: 'неизвестно',
            phone: '+375000000000',
            typePost: 'E',
            city: '',
            adress: '',
            oblast: '',
            raion: '',
            postCode: '',
            photo: [],
            other: '',
            price: '',
            firstClass: false,
            status: 1
        }

        const response = await $host.post('api/order/addOrder', data)

        dispach(addOrder(response.data))

        const newOrderDate = new Date(response.data.createdAt)

        setEndDate(prevEndDate => newOrderDate > prevEndDate ? newOrderDate : prevEndDate)

        handleDetailsClick(response.data.id)
    }

    const [statusFilterVisible, setStatusFilterVisible] = useState(false)



    const [filterCheck, setFilterCheck] = useState([0, 1, 2, 3, 4, 7, 8])

    const Check = (checked, ids) => {
        setFilterCheck(prev => {
            if (checked) {
                return [...new Set([...prev, ...ids])]
            }

            return prev.filter(el => !ids.includes(el))
        })
    }

    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(new Date())

    const filteredOrders = orders.filter((order) => {
        if (selectedType === 'All') return true
        if (selectedType === 'R0') return order.typePost === 'R' || order.typePost === 'R1' || order.typePost === 'R2'
        if (selectedType === 'R1') return order.typePost === 'R1' || order.typePost === 'R2'
        if (selectedType === 'E0') return order.typePost === 'E' || order.typePost === 'E1'
        return order.typePost === selectedType
    })
        .filter((order) => {
            const data = order.FIO +
                order.adress +
                order.city +
                order.phone +
                order.postCode +
                order.codeOutside +
                order.other +
                order.price +
                order.name +
                order.phone +
                order.notes +
                order.user?.FIO +
                order.user?.aboutUser +
                order.user?.phone

            return data.toLowerCase().includes(searchQuery.toLowerCase())
        })
        .filter(s => filterCheck.includes(Number(s.status)))
        .filter((order) => {
            const orderDate = new Date(order.createdAt)
            if (isAdmin && (dateFrom || dateTo)) {
                const day = order.createdAt.slice(0, 10)
                return (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo)
            }
            return !startDate || !endDate || (orderDate >= startDate && orderDate <= endDate)
        })
        .filter((order) => {
            if (onlyGlossy) return order.photos.some(el => el.paper === 'glossy')
            return true
        })
        .filter((order) => {
            if (onlyLustre) return order.photos.some(el => el.paper === 'lustre')
            return true
        })
        .filter((order) => {
            if (onlyHolst) return order.photos.some(el => el.type === 'holst')
            return true
        })
        .filter((order) => {
            if (onlyMagnit) return order.photos.some(el => el.type === 'magnit')
            return true
        })
        .filter((order) => {
            if (onlyA4) return order.photos.some(el => el.format === 'а4' || el.format === '<а4')
            return true
        })
        .filter(order => !onlyPoster || (order.photos || []).some(el => el.type === 'poster'))

    useEffect(() => {
        if (!datePickerOpen) return
        const closeOnOutside = event => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) setDatePickerOpen(false)
        }
        document.addEventListener('mousedown', closeOnOutside)
        return () => document.removeEventListener('mousedown', closeOnOutside)
    }, [datePickerOpen])
    const startDateSet = useRef(false)

    useEffect(() => {
        if (orders.length > 0 && !startDateSet.current) {
            let ordersDataStart = _.orderBy(orders, 'createdAt', 'desc')
            setStartDate(new Date(ordersDataStart[orders.length - 1].createdAt))
            startDateSet.current = true
        }
    }, [orders])

    const [startArchive, setStartArchive] = useState(0)
    const [endArchive, setEndArchive] = useState(0)

    const DownloadArchive = () => {
        setIsLoading(true)

        const data = { startArchive, endArchive }

        $host.get('api/order/getAllArchive', { params: data })
            .then(res => {
                dispach(saveOrders(res.data.orders))
                dispach(saveSettings(res.data.settings))
                dispach(saveUsers(res.data.users))

                let ordersDataStart = _.orderBy(res.data.orders, 'createdAt', 'desc')
                setStartDate(new Date(ordersDataStart[ordersDataStart.length - 1].createdAt))
            })
            .catch(err => {
                console.error('Ошибка загрузки архива:', err)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }

    const [isOpen, setIsOpen] = useState(false)
    const [listPayEP, setListPayEP] = useState([])

    const handleFileChange = (e) => {
        const file = e.target.files[0]

        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    const filteredData = result.data.map(row => row['ТРЕК-НОМЕР ПЧО'])
                    setListPayEP(filteredData)
                },
                error: (error) => {
                    console.error('Ошибка при обработке CSV:', error)
                }
            })
        }
    }

    const checkPayEP = async () => {
        try {
            const data = { list: listPayEP }

            setIsOpen(false)

            await $host.post('api/ep/changeStatusEP', data)

            setListPayEP([])

            alert(`${listPayEP.length} заказов перенесены в оплаченные!`)
        } catch (error) {
            console.error('Ошибка:', error)
            alert('Произошла ошибка при обновлении статусов')
        }
    }

    const selectClass = 'h-[30px] min-w-0 rounded-md border-[1px] ring-1 ring-inset ring-[#E2E8F0] bg-white px-2 text-xs font-normal text-slate-700 outline-none transition-colors focus:ring-1 focus:ring-[#7890A8] md:h-[32px] md:text-xs'

    const filterButtonClass = 'flex h-[32px] min-w-[60px] items-center justify-center rounded-md border-[1px] ring-1 ring-inset ring-[#E2E8F0] px-3 text-xs font-medium cursor-pointer transition-colors hover:ring-[#7890A8]'

    const mainButtonClass = 'flex h-[32px] w-[50px] shrink-0 items-center justify-center rounded-md bg-[#274C77] text-white transition-colors hover:bg-[#1E3A5D]'

    return (
        <div className="w-full min-w-0 max-md:px-2 font-sans text-base font-medium text-black antialiased">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="mb-3">Оплата европочты</DialogTitle>
                        <div>
                            <Input type="file" accept=".csv" onChange={handleFileChange} />
                            <div className="mt-3 max-h-[310px] overflow-y-auto text-xs">
                                {listPayEP.map((trackNumber, index) => (
                                    <div key={index}>{trackNumber}</div>
                                ))}
                            </div>
                            <div className="flex justify-end">
                                <Button className="mt-5 mr-5 h-8 text-xs font-medium" onClick={() => checkPayEP()}>
                                    перенести в "оплачено"
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            {(
                <div className="flex w-full min-w-0 items-start bg-white gap-2 max-md:gap-1 max-md:px-2 px-3 py-2.5 my-3 rounded-xl shadow-sm" style={{ border: "1px solid #97a8b9", boxSizing: "border-box" }}>
                    <div className="flex w-full min-w-0 flex-wrap max-md:flex-nowrap items-center gap-1 md:flex-1 md:gap-2.5">
                        <button
                            className='hidden md:flex h-[32px] w-[50px] shrink-0 items-center justify-center rounded-md bg-white ring-1 ring-inset ring-[#E2E8F0] text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#274C77] md:mr-2'
                            onClick={AddNewOrder}
                        >
                            <i className="bi bi-folder-plus text-sm"></i>
                        </button>

                        <select
                            className={`${selectClass} min-w-0 max-w-[110px] flex-1 md:w-[130px] md:max-w-none md:flex-none`}
                            value={selectedType}
                            onChange={handleSelectChange}
                        >
                            <option value="All">Все</option>
                            <option value="E0">европочта</option>
                            <option value="E1">европочта(ЕРИП)</option>
                            <option value="E">европочта(налож)</option>
                            <option value="R0">белпочта</option>
                            <option value="R1">белпочта(ЕРИП)</option>
                            <option value="R">белпочта(налож)</option>
                        </select>

                        <input
                            className="h-[30px] min-w-0 flex-[2] rounded-md ring-1 ring-inset ring-[#E2E8F0] bg-white px-2 text-xs font-normal text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus:border-[#274C77] focus:ring-1 focus:ring-[#274C77]/15 md:h-[32px] md:w-[160px] md:flex-none"
                            type="text"
                            placeholder="Поиск"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />

                        {isAdmin && (
                            <div className="relative hidden md:block shrink-0 ml-1" ref={datePickerRef}>
                                <button
                                    type="button"
                                    className={`flex h-[32px] items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${dateFrom || dateTo ? 'ring-1 ring-inset ring-[#274C77] bg-[#274C77] text-white' : 'ring-1 ring-inset ring-[#E2E8F0] bg-white text-slate-700 hover:ring-[#7890A8]'}`}
                                    onClick={() => setDatePickerOpen(prev => !prev)}
                                    title="Фильтр заказов по дате"
                                >
                                    <i className="bi bi-calendar3" />
                                    <span className="hidden lg:inline">{dateFrom || dateTo ? 'Период выбран' : 'Период'}</span>
                                </button>
                                {datePickerOpen && (
                                    <div className="absolute right-0 top-full z-30 mt-2 w-[min(260px,85vw)] rounded-xl ring-1 ring-inset ring-[#E2E8F0] bg-white p-3 shadow-xl">
                                        <div className="mb-3 text-sm font-semibold text-stone-800">Диапазон дат</div>
                                        <label className="mb-2 block text-xs font-medium text-stone-600">
                                            С даты
                                            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)} className="mt-1 block h-9 w-full rounded-md border border-stone-300 bg-white px-2 text-sm outline-none focus:border-[#274C77]" />
                                        </label>
                                        <label className="block text-xs font-medium text-stone-600">
                                            По дату (включительно)
                                            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} className="mt-1 block h-9 w-full rounded-md border border-stone-300 bg-white px-2 text-sm outline-none focus:border-[#274C77]" />
                                        </label>
                                        <div className="mt-3 flex items-center justify-between">
                                            <button type="button" className="text-xs text-stone-500 hover:text-stone-800" onClick={() => { setDateFrom(''); setDateTo('') }}>Сбросить</button>
                                            <button type="button" className="rounded-md bg-[#274C77] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1E3A5D]" onClick={() => setDatePickerOpen(false)}>Готово</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {isAdmin && (
                            <button type="button" onClick={() => setSortKey(prev => prev === 'price' ? 'default' : 'price')} title={sortKey === 'price' ? 'Вернуть обычную сортировку' : 'Сортировать по цене (от большей к меньшей)'} className={`flex h-[32px] md:mr-2 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${sortKey === 'price' ? 'ring-1 ring-inset ring-[#274C77] bg-[#274C77] text-white' : 'ring-1 ring-inset ring-[#E2E8F0] bg-white text-slate-700 hover:ring-[#7890A8]'}`}>
                                <i className="bi bi-sort-numeric-down-alt" />
                                <span className="hidden lg:inline">По цене</span>
                            </button>
                        )}
                        <button
                            className={`${filterButtonClass} max-md:hidden xl:ml-auto ${onlyGlossy ? 'ring-1 ring-inset ring-[#274C77] bg-[#274C77] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => toggleProductFilter('glossy')}
                        >
                            glossy
                        </button>
                        <button
                            className={`${filterButtonClass} max-md:hidden ${onlyLustre ? 'ring-1 ring-inset ring-[#274C77] bg-[#274C77] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => toggleProductFilter('lustre')}
                        >
                            lustre
                        </button>

                        <button
                            className={`${filterButtonClass} max-md:hidden ${onlyHolst ? 'ring-1 ring-inset ring-[#274C77] bg-[#274C77] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => toggleProductFilter('holst')}
                        >
                            holst
                        </button>

                        <button
                            className={`${filterButtonClass} max-md:hidden ${onlyMagnit ? 'ring-1 ring-inset ring-[#274C77] bg-[#274C77] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => toggleProductFilter('magnit')}
                        >
                            magnit
                        </button>

                        <button
                            className={`${filterButtonClass} max-md:hidden ${onlyA4 ? 'ring-1 ring-inset ring-[#274C77] bg-[#274C77] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => toggleProductFilter('A4')}
                        >
                            A4
                        </button>

                        <button
                            className={`${filterButtonClass} max-md:hidden mr-2 ${onlyPoster ? 'ring-1 ring-inset ring-[#274C77] bg-[#274C77] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => toggleProductFilter('poster')}
                        >
                            poster
                        </button>
                        {selectedType === 'E' && (
                            <button
                                className={`${mainButtonClass} max-md:hidden`}
                                onClick={() => setIsOpen(true)}
                            >
                                <i className="bi bi-wallet2 text-sm"></i>
                            </button>
                        )}
                    </div>

                    <div
                        className="relative shrink-0"
                        
                    >
                        <button type="button" className={mainButtonClass} onClick={() => setStatusFilterVisible(prev => !prev)} aria-expanded={statusFilterVisible}>
                            <i className="bi bi-filter-square text-sm"></i>
                        </button>

                        {statusFilterVisible && (
                            <div className="absolute top-full right-0 z-10 flex w-[180px] flex-col gap-2 rounded-lg border ring-1 ring-inset ring-[#E2E8F0] bg-white p-3 shadow-lg">
                                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50">
                                    <input
                                        className="h-4 w-4 accent-[#274C77]"
                                        type="checkbox"
                                        checked={[0, 1, 2, 3, 4, 7, 8].every(id => filterCheck.includes(id))}
                                        onChange={e => Check(e.target.checked, [0, 1, 2, 3, 4, 7, 8])}
                                    />
                                    В работе
                                </label>

                                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50">
                                    <input
                                        className="h-4 w-4 accent-[#274C77]"
                                        type="checkbox"
                                        checked={filterCheck.includes(5)}
                                        onChange={e => Check(e.target.checked, [5])}
                                    />
                                    Отправленные
                                </label>

                                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50">
                                    <input
                                        className="h-4 w-4 accent-[#274C77]"
                                        type="checkbox"
                                        checked={filterCheck.includes(6)}
                                        onChange={e => Check(e.target.checked, [6])}
                                    />
                                    Оплаченные
                                </label>

                                <div className="flex flex-col gap-2 border-t border-slate-100 pt-2">
                                    <button
                                        className="text-left text-xs font-medium text-slate-600 hover:text-[#274C77]"
                                        onClick={DownloadArchive}
                                    >
                                        загрузить архив
                                    </button>

                                    <div className="flex w-full gap-2">
                                        <input
                                            className="w-0 flex-1 rounded border border-slate-300 px-1.5 py-1 text-xs font-normal outline-none focus:border-[#274C77]"
                                            value={startArchive}
                                            onChange={e => setStartArchive(e.target.value)}
                                        />
                                        <input
                                            className="w-0 flex-1 rounded border border-slate-300 px-1.5 py-1 text-xs font-normal outline-none focus:border-[#274C77]"
                                            value={endArchive}
                                            onChange={e => setEndArchive(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="w-full min-w-0">
                <div className="w-full min-w-0">
                    {isLoading ? (
                        <OrdersSkeleton rows={12} />
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order.id}>
                                <TableRow
                                    orders={orders}
                                    order={order}
                                    handleDetailsClick={handleDetailsClick}
                                    selectedOrder={selectedOrder}
                                    setSelectedOrder={setSelectedOrder}
                                    collapsedOrderId={collapsedOrderId}
                                    setCollapsedOrderId={setCollapsedOrderId}
                                    isChanged={isChanged}
                                    setIsChanged={setIsChanged}
                                    descRowRef={descRowRef}
                                />
                            </div>
                        ))
                    )}
                </div>

                {!isLoading && (
                    <TableFooter filteredOrders={filteredOrders} activeFilters={{ glossy: onlyGlossy, lustre: onlyLustre, holst: onlyHolst, magnit: onlyMagnit, A4: onlyA4, poster: onlyPoster }} />
                )}
            </div>
        </div>
    )
}
