
import { React, useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import _ from 'lodash'
import { $host } from '../../http/index'
import { TableRow } from './TableRow'
import { addOrder, saveOrders, saveSettings, saveUsers, updateOrderStatus } from '../../store/orderReducer'
import { TableFooter } from './TableFooter'
import { ModalOrder } from './ModalOrder'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog'
import Papa from 'papaparse'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'

const OrdersSkeleton = ({ rows = 10, mobile = false }) => {
    if (mobile) {
        return (
            <div className="flex flex-col gap-2 px-2 pt-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-white p-3"
                        style={{
                            animation: 'fadeIn 0.4s ease-out both',
                            animationDelay: `${i * 60}ms`
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="h-3 w-24 animate-pulse rounded bg-stone-200" />
                            <div className="h-3 w-16 animate-pulse rounded bg-stone-200" />
                        </div>
                        <div className="h-3 w-3/4 animate-pulse rounded bg-stone-200" />
                        <div className="mt-1 flex items-center justify-between">
                            <div className="h-3 w-1/3 animate-pulse rounded bg-stone-200" />
                            <div className="h-6 w-20 animate-pulse rounded bg-stone-200" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="px-2 pt-3">
            <div className="flex flex-col gap-1.5">
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-3"
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
    const [onlyGlossy, setOnlyGlossy] = useState(false)
    const [onlyLustre, setOnlyLustre] = useState(false)
    const [onlyHolst, setOnlyHolst] = useState(false)
    const [onlyMagnit, setOnlyMagnit] = useState(false)
    const [onlyA4, setOnlyA4] = useState(false)
    const [onlyPoster, setOnlyPoster] = useState(false)
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

    const handleStatusFilterMouseEnter = () => {
        setStatusFilterVisible(true)
    }

    const handleStatusFilterMouseLeave = () => {
        setStatusFilterVisible(false)
    }

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

    const ShowOrigin = (order) => {
        switch (order.origin) {
            case 'telegram':
                return <i className="bi bi-send text-green-800"></i>
            case 'website':
                return <i className="bi bi-lightning-fill text-green-800"></i>
            case 'email':
                return <i className="bi bi-envelope text-green-800"></i>
            default:
                return <i className="bi bi-send text-green-800"></i>
        }
    }

    const photo = (order) => {
        return order.photos.reduce((sum, el) => {
            if (el.paper === 'lustre') {
                return sum + el.amount * el.copies + 'шт(' + el.format + ')ЛЮСТР '
            }

            return sum + el.amount * el.copies + 'шт(' + el.format + ') '
        }, '')
    }

    const ShowData = (order) => {
        const data = `${order.createdAt.split('T')[0].split('-')[2]}.${order.createdAt.split('T')[0].split('-')[1]}`
        const time = `${order.createdAt.split('T')[1].split(':')[0]}:${order.createdAt.split('T')[1].split(':')[1]}`

        return `${data} (${time})`
    }

    const ColorBG = [
        '#97d0d6',
        '#D8BFD8',
        '#FDFD96',
        '#98FF98',
        'DarkGrey',
        'white'
    ]

    const ChangeStatus = (event, order) => {
        $host.put(`api/order/updateStatus/${order.id}`, { status: event.target.value })
        dispach(updateOrderStatus(order.id, event.target.value))
        setOrderModal(prev => ({ ...prev, status: event.target.value }))
    }

    const Warning = (order) => {
        let a = []

        if (order.codeOutside) {
            a.push(<i className="bi bi-qr-code ml-[5px]"></i>)
        }

        if (order.firstClass === true) {
            a.push(<i className="bi bi-1-square-fill ml-[5px] pr-1 text-red-600"></i>)
        }

        if (order.notes) {
            a.push(<i className="bi bi-exclamation-square-fill ml-[5px] text-orange-500"></i>)
        }

        if (order.other) {
            a.push(<i className="bi bi-exclamation-square-fill ml-[5px] text-lime-600"></i>)
        }

        return a.map((el, index) => <span key={index}>{el} </span>)
    }

    const handleProcess = (e) => {
        switch (e) {
            case '1':
                return setFilterCheck([0, 1, 2, 3, 4, 7, 8])
            case '2':
                return setFilterCheck([5])
            case '3':
                return setFilterCheck([6])
            default:
                return setFilterCheck([0, 1, 2, 3, 4, 7, 8])
        }
    }

    const [activeModal, setActiveModal] = useState(false)
    const [orderModal, setOrderModal] = useState({})

    const ClickOrderMobile = (order) => {
        setActiveModal(true)
        setOrderModal(order)
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

    const selectClass = 'h-[30px] min-w-0 rounded-md border-[1px] border-teal-800/50 bg-white px-2 text-xs font-normal text-slate-700 outline-none transition-colors focus:border-teal-700 focus:ring-1 focus:ring-teal-700 md:h-[32px] md:text-xs'

    const filterButtonClass = 'hidden md:flex h-[32px] min-w-[60px] items-center justify-center rounded-md border-[1px] border-teal-800/50 px-3 text-xs font-medium cursor-pointer transition-colors hover:border-slate-400'

    const mainButtonClass = 'hidden md:flex h-[32px] w-[50px] shrink-0 items-center justify-center rounded-md border-0 bg-[#2f616b] text-white transition-colors hover:bg-[#434343]'

    return (
        <div className="font-sans text-base font-medium text-black antialiased">
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

            {!activeModal && (
                <div className="flex w-full items-center bg-teal-800/10 gap-2 px-2 py-2 my-3 border-[1px] border-teal-800/20 rounded-md ">
                    <div className="flex w-full min-w-0 items-center gap-1 md:flex-1 md:gap-2.5">
                        <button
                            className='hidden md:flex h-[32px] w-[50px] shrink-0 items-center justify-center rounded-md bg-white border-[1px] border-teal-800/50 text-teal-800 transition-colors hover:bg-[#434343] md:mr-6'
                            onClick={AddNewOrder}
                        >
                            <i className="bi bi-folder-plus text-sm"></i>
                        </button>

                        <select
                            className={`${selectClass} max-w-[50px] flex-1 md:w-[130px] md:max-w-none md:flex-none`}
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
                            className="h-[30px] min-w-0 flex-[2] rounded-md border-[1px] border-teal-800/50 bg-white px-2 text-xs font-normal text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus:border-teal-700 focus:ring-1 focus:ring-teal-700 md:h-[32px] md:w-[160px] md:flex-none"
                            type="text"
                            placeholder="Поиск"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />

                        {isAdmin && (
                            <div className="relative shrink-0 ml-8" ref={datePickerRef}>
                                <button
                                    type="button"
                                    className={`flex h-[32px] items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${dateFrom || dateTo ? 'border-[#2f616b] bg-[#2f616b] text-white' : 'border-teal-800/50 bg-white text-slate-700 hover:border-teal-700'}`}
                                    onClick={() => setDatePickerOpen(prev => !prev)}
                                    title="Фильтр заказов по дате"
                                >
                                    <i className="bi bi-calendar3" />
                                    <span className="hidden lg:inline">{dateFrom || dateTo ? 'Период выбран' : 'Период'}</span>
                                </button>
                                {datePickerOpen && (
                                    <div className="absolute right-0 top-full z-30 mt-2 w-[260px] rounded-xl border border-stone-200 bg-white p-3 shadow-xl">
                                        <div className="mb-3 text-sm font-semibold text-stone-800">Диапазон дат</div>
                                        <label className="mb-2 block text-xs font-medium text-stone-600">
                                            С даты
                                            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)} className="mt-1 block h-9 w-full rounded-md border border-stone-300 bg-white px-2 text-sm outline-none focus:border-teal-700" />
                                        </label>
                                        <label className="block text-xs font-medium text-stone-600">
                                            По дату (включительно)
                                            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} className="mt-1 block h-9 w-full rounded-md border border-stone-300 bg-white px-2 text-sm outline-none focus:border-teal-700" />
                                        </label>
                                        <div className="mt-3 flex items-center justify-between">
                                            <button type="button" className="text-xs text-stone-500 hover:text-stone-800" onClick={() => { setDateFrom(''); setDateTo('') }}>Сбросить</button>
                                            <button type="button" className="rounded-md bg-[#2f616b] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#244e56]" onClick={() => setDatePickerOpen(false)}>Готово</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {isAdmin && (
                            <button type="button" onClick={() => setSortKey(prev => prev === 'price' ? 'default' : 'price')} title={sortKey === 'price' ? 'Вернуть обычную сортировку' : 'Сортировать по цене (от большей к меньшей)'} className={`flex h-[32px] mr-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${sortKey === 'price' ? 'border-[#2f616b] bg-[#2f616b] text-white' : 'border-teal-800/50 bg-white text-slate-700 hover:border-teal-700'}`}>
                                <i className="bi bi-sort-numeric-down-alt" />
                                <span className="hidden lg:inline">По цене</span>
                            </button>
                        )}
                        <select
                            className={`${selectClass} max-w-[100px] flex-1 md:hidden`}
                            value={filterCheck.length === 1 && filterCheck.includes(5) ? '2' : filterCheck.length === 1 && filterCheck.includes(6) ? '3' : '1'}
                            onChange={e => handleProcess(e.target.value)}
                        >
                            <option value="1">в работе</option>
                            <option value="2">отправленные</option>
                            <option value="3">оплаченные</option>
                        </select>

                        <button
                            className={`${filterButtonClass} md:ml-auto ${onlyGlossy ? 'border-[#2f616b] bg-[#2f616b] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => setOnlyGlossy(!onlyGlossy)}
                        >
                            glossy
                        </button>
                        <button
                            className={`${filterButtonClass} ${onlyLustre ? 'border-[#2f616b] bg-[#2f616b] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => setOnlyLustre(!onlyLustre)}
                        >
                            lustre
                        </button>

                        <button
                            className={`${filterButtonClass} ${onlyHolst ? 'border-[#2f616b] bg-[#2f616b] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => setOnlyHolst(!onlyHolst)}
                        >
                            holst
                        </button>

                        <button
                            className={`${filterButtonClass} ${onlyMagnit ? 'border-[#2f616b] bg-[#2f616b] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => setOnlyMagnit(!onlyMagnit)}
                        >
                            magnit
                        </button>

                        <button
                            className={`${filterButtonClass} ${onlyA4 ? 'border-[#2f616b] bg-[#2f616b] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => setOnlyA4(!onlyA4)}
                        >
                            A4
                        </button>

                        <button
                            className={`${filterButtonClass} mr-8 ${onlyPoster ? 'border-[#2f616b] bg-[#2f616b] text-white' : 'bg-white text-slate-700'}`}
                            onClick={() => setOnlyPoster(prev => !prev)}
                        >
                            poster
                        </button>
                        {selectedType === 'E' && (
                            <button
                                className={mainButtonClass}
                                onClick={() => setIsOpen(true)}
                            >
                                <i className="bi bi-wallet2 text-sm"></i>
                            </button>
                        )}
                    </div>

                    <div
                        className="relative hidden shrink-0 md:block"
                        onMouseEnter={handleStatusFilterMouseEnter}
                        onMouseLeave={handleStatusFilterMouseLeave}
                    >
                        <button className={mainButtonClass}>
                            <i className="bi bi-filter-square text-sm"></i>
                        </button>

                        {statusFilterVisible && (
                            <div className="absolute top-full right-0 z-10 flex w-[180px] flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50">
                                    <input
                                        className="h-4 w-4 accent-teal-700"
                                        type="checkbox"
                                        checked={[0, 1, 2, 3, 4, 7, 8].every(id => filterCheck.includes(id))}
                                        onChange={e => Check(e.target.checked, [0, 1, 2, 3, 4, 7, 8])}
                                    />
                                    В работе
                                </label>

                                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50">
                                    <input
                                        className="h-4 w-4 accent-teal-700"
                                        type="checkbox"
                                        checked={filterCheck.includes(5)}
                                        onChange={e => Check(e.target.checked, [5])}
                                    />
                                    Отправленные
                                </label>

                                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50">
                                    <input
                                        className="h-4 w-4 accent-teal-700"
                                        type="checkbox"
                                        checked={filterCheck.includes(6)}
                                        onChange={e => Check(e.target.checked, [6])}
                                    />
                                    Оплаченные
                                </label>

                                <div className="flex flex-col gap-2 border-t border-slate-100 pt-2">
                                    <button
                                        className="text-left text-xs font-medium text-slate-600 hover:text-teal-700"
                                        onClick={DownloadArchive}
                                    >
                                        загрузить архив
                                    </button>

                                    <div className="flex w-full gap-2">
                                        <input
                                            className="w-0 flex-1 rounded border border-slate-300 px-1.5 py-1 text-xs font-normal outline-none focus:border-teal-700"
                                            value={startArchive}
                                            onChange={e => setStartArchive(e.target.value)}
                                        />
                                        <input
                                            className="w-0 flex-1 rounded border border-slate-300 px-1.5 py-1 text-xs font-normal outline-none focus:border-teal-700"
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

            <div className="md:hidden">
                <div className="relative flex flex-col">
                    {activeModal ? (
                        <ModalOrder
                            order={orderModal}
                            activeModal={activeModal}
                            setActiveModal={setActiveModal}
                            ChangeStatus={ChangeStatus}
                        />
                    ) : (
                        <div>
                            {isLoading ? (
                                <OrdersSkeleton rows={5} mobile={true} />
                            ) : (
                                filteredOrders.map(order => (
                                    <div key={order.id} onClick={event => event.stopPropagation()}>
                                        <div
                                            className={`mx-0.5 my-0.5 flex h-[54px] cursor-pointer items-center gap-2.5 border-b border-slate-200 px-1 py-1.5 ${selectedOrder === order.id ? 'bg-slate-200' : 'bg-slate-50'}`}
                                            onClick={() => ClickOrderMobile(order)}
                                        >
                                            <div className="ml-1 flex flex-[1.5] flex-col gap-1 text-[11px] font-normal text-slate-600">
                                                <div className="whitespace-nowrap rounded-full border border-slate-300 px-1.5 py-0.5 text-center text-[11px] font-medium text-slate-700">
                                                    {ShowOrigin(order)} &nbsp; {order.typePost + (order.order_number % 1000)}
                                                </div>
                                                <div className="text-center text-[10px] text-slate-500">
                                                    {ShowData(order)}
                                                </div>
                                            </div>

                                            <div className="flex max-w-[200px] min-w-0 flex-[4] flex-col gap-1 overflow-hidden">
                                                <div className="truncate text-xs font-medium text-slate-800">
                                                    {order?.user?.FIO}
                                                </div>
                                                <div className="flex justify-between gap-1 text-[11px] font-normal text-slate-500">
                                                    <div className="min-w-0 truncate">
                                                        {photo(order)}
                                                    </div>
                                                    <div className="shrink-0">
                                                        {Warning(order)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex min-w-0 flex-[2] flex-col gap-1 text-center">
                                                <div className="whitespace-nowrap text-xs font-medium tabular-nums text-slate-800">
                                                    {(Number(order.price) + Number(order.price_deliver)).toFixed(2)}р
                                                </div>

                                                <div onClick={event => event.stopPropagation()}>
                                                    <select
                                                        className="w-full rounded-md border border-slate-300 px-1 py-0.5 text-[11px] font-normal text-slate-800 outline-none"
                                                        style={{ backgroundColor: ColorBG[order.status - 1] }}
                                                        value={order.status}
                                                        onChange={e => ChangeStatus(e, order)}
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
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            <TableFooter filteredOrders={filteredOrders} activeFilters={{ glossy: onlyGlossy, lustre: onlyLustre, holst: onlyHolst, magnit: onlyMagnit, A4: onlyA4, poster: onlyPoster }} />
                        </div>
                    )}
                </div>
            </div>

            <div className="hidden md:block">
                <div className="overflow-x-auto whitespace-nowrap">
                    {isLoading ? (
                        <OrdersSkeleton rows={12} mobile={false} />
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
