import { useEffect, useState, useMemo } from 'react';
import { $host } from "../http";
import { NavBar } from "../components/admin/NavBar";
import { toast } from 'sonner';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import MaterialTab from "../components/statistic/MaterialTab";
import { MONTHS_SHORT, WEEKDAYS_SHORT, MONTHS_RU, PERIOD_OPTIONS, YEAR_COLORS, ORIGIN_COLORS, ORIGIN_LABELS, formatNumber, getPeriodRange, OriginPercentTooltip, TABS, FancySelect, NewClientsTable } from "../components/statistic/StatisticCommon";


// ============ ГЛАВНЫЙ КОМПОНЕНТ ============
const Statistic = () => {
    const [order, setOrder] = useState([]);
    const [type, setType] = useState('day');
    const [loading, setLoading] = useState(true);
    const [daysPeriod, setDaysPeriod] = useState(6);
    // ===== Период (для вкладок График / По годам / По дням) =====
    const now = new Date();
    const [startYear, setStartYear] = useState(String(now.getFullYear()));
    const [startMonth, setStartMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
    const [period, setPeriod] = useState('1');
    const changeTab = value => {
        setType(value);
        if (value === 'month') {
            setPeriod('all');
        }
    };

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const result = [];
        for (let y = currentYear; y >= 2020; y--) result.push(String(y));
        return result;
    }, []);
    // ============ ЗАГРУЗКА ============
    useEffect(() => {
        $host.get('api/order/getAllStat')
            .then(({ data }) => setOrder(data.orders))
            .catch(err => {
                console.error(err);
                toast.error('Не удалось загрузить статистику');
            })
            .finally(() => setLoading(false));
    }, []);
    // ============ ФИЛЬТР ДАННЫХ ПО ПЕРИОДУ ============
    const filteredOrder = useMemo(() => {
        const periodOption = PERIOD_OPTIONS.find(p => p.value === period);
        if (!periodOption || periodOption.months === null) return order;
        const { from, to } = getPeriodRange(startYear, startMonth, periodOption);
        return order.filter(o => {
            const d = new Date(o.createdAt);
            return d >= from && d <= to;
        });
    }, [order, startYear, startMonth, period]);
    // Показываем ли панель периода (не на вкладке новых клиентов)
    const showPeriodPanel = type !== 'newClientsMonth';
    // ============ СВОДКА ============
    const totalRevenue = useMemo(() =>
        filteredOrder.reduce((s, o) => s + (Number(o.price) || 0), 0), [filteredOrder]);
    const totalOrders = filteredOrder.length;
    const totalClients = useMemo(() => {
        const set = new Set(filteredOrder.map(o => o.phone).filter(Boolean));
        return set.size;
    }, [filteredOrder]);
    const avgCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    // ============ ГРАФИК ПО МЕСЯЦАМ ============
    const monthlySum = useMemo(() => {
        const grouped = filteredOrder.reduce((acc, curr) => {
            const date = new Date(curr.createdAt);
            const monthNumber = date.getMonth() + 1;
            const year = date.getFullYear();
            const key = `${year}-${String(monthNumber).padStart(2, '0')}`;
            const price = parseFloat(curr.price);
            if (isNaN(price)) return acc;
            if (!acc[key]) {
                acc[key] = {
                    key,
                    month: `${MONTHS_SHORT[monthNumber - 1]} ${String(year).slice(-2)}`,
                    monthNumber,
                    year,
                    total: 0,
                };
            }
            acc[key].total = parseFloat((acc[key].total + price).toFixed(2));
            return acc;
        }, {});
        const arr = Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return arr.map(item => {
            if (item.key === currentKey) {
                const daysInMonth = new Date(item.year, item.monthNumber, 0).getDate();
                const currentDay = now.getDate();
                const projected = currentDay > 0
                    ? (item.total / currentDay) * daysInMonth
                    : 0;
                return { ...item, projected: Number(projected.toFixed(2)) };
            }
            return item;
        });
    }, [filteredOrder]);
        // ============ ГРАФИК ПО МЕСЯЦАМ ============
    const monthlySumPartner = useMemo(() => {
        const ordersWithoutPartners = order.filter(o => o.role === 'PARTNER');
        const grouped = ordersWithoutPartners.reduce((acc, curr) => {
            const date = new Date(curr.createdAt);
            const monthNumber = date.getMonth() + 1;
            const year = date.getFullYear();
            const key = `${year}-${String(monthNumber).padStart(2, '0')}`;
            const price = parseFloat(curr.price);
            if (isNaN(price)) return acc;
            if (!acc[key]) {
                acc[key] = {
                    key,
                    month: `${MONTHS_SHORT[monthNumber - 1]} ${String(year).slice(-2)}`,
                    monthNumber,
                    year,
                    total: 0,
                };
            }
            acc[key].total = parseFloat((acc[key].total + price).toFixed(2));
            return acc;
        }, {});
        const arr = Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return arr.map(item => {
            if (item.key === currentKey) {
                const daysInMonth = new Date(item.year, item.monthNumber, 0).getDate();
                const currentDay = now.getDate();
                const projected = currentDay > 0
                    ? (item.total / currentDay) * daysInMonth
                    : 0;
                return { ...item, projected: Number(projected.toFixed(2)) };
            }
            return item;
        });
    }, [order]);
    // ============ ПО ГОДАМ ============
    const ordersByYear = useMemo(() => {
        const grouped = filteredOrder.reduce((acc, o) => {
            const date = new Date(o.createdAt);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const price = parseFloat(o.price);
            if (isNaN(price)) return acc;
            if (!acc[year]) acc[year] = { year, months: {}, total: 0, orders: 0 };
            acc[year].months[month] = (acc[year].months[month] || 0) + price;
            acc[year].total += price;
            acc[year].orders += 1;
            return acc;
        }, {});
        return Object.values(grouped)
            .sort((a, b) => b.year - a.year)
            .map(y => ({
                ...y,
                months: Object.fromEntries(
                    Object.entries(y.months).map(([k, v]) => [k, Number(v.toFixed(2))])
                ),
                total: Number(y.total.toFixed(2)),
            }));
    }, [filteredOrder]);

    const yearsChartData = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        const elapsedMs = now.getTime() - yearStart.getTime();
        const totalMs = yearEnd.getTime() - yearStart.getTime();
        const elapsedRatio = Math.min(1, elapsedMs / totalMs);
        return [...ordersByYear]
            .sort((a, b) => a.year - b.year)
            .map(y => {
                const isCurrent = y.year === currentYear;
                const projected = isCurrent && elapsedRatio > 0
                    ? Number((y.total / elapsedRatio).toFixed(2))
                    : null;
                return {
                    year: String(y.year),
                    total: y.total,
                    projected,
                    orders: y.orders,
                };
            });
    }, [ordersByYear]);

    const monthsCompareData = useMemo(() => {
        const years = ordersByYear.map(y => y.year).sort((a, b) => a - b);
        const recentYears = years.slice(-4);
        return MONTHS_SHORT.map((monthName, i) => {
            const monthNumber = i + 1;
            const row = { month: monthName };
            recentYears.forEach(y => {
                const yearData = ordersByYear.find(o => o.year === y);
                row[`y${y}`] = yearData?.months[monthNumber]
                    ? Number(yearData.months[monthNumber].toFixed(2))
                    : 0;
            });
            return row;
        });
    }, [ordersByYear]);

    const recentYears = useMemo(() => {
        const years = ordersByYear.map(y => y.year).sort((a, b) => a - b);
        return years.slice(-4);
    }, [ordersByYear]);

    const ordersYearsChartData = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        const elapsedMs = now.getTime() - yearStart.getTime();
        const totalMs = yearEnd.getTime() - yearStart.getTime();
        const elapsedRatio = Math.min(1, elapsedMs / totalMs);
        return [...ordersByYear]
            .sort((a, b) => a.year - b.year)
            .map(y => {
                const isCurrent = y.year === currentYear;
                const projected = isCurrent && elapsedRatio > 0
                    ? Math.round(y.orders / elapsedRatio)
                    : null;
                return {
                    year: String(y.year),
                    orders: y.orders,
                    projected,
                };
            });
    }, [ordersByYear]);

    // ============ ИСТОЧНИКИ ЗАКАЗОВ — % (stacked bar) ============
    const originPercentData = useMemo(() => {
        // Фильтруем — исключаем заказы от партнёров
        const ordersWithoutPartners = order.filter(o => o.role !== 'PARTNER');
        const grouped = ordersWithoutPartners.reduce((acc, curr) => {
            const date = new Date(curr.createdAt);
            const monthNumber = date.getMonth() + 1;
            const year = date.getFullYear();
            const key = `${year}-${String(monthNumber).padStart(2, '0')}`;
            const price = parseFloat(curr.price);
            if (isNaN(price)) return acc;
            const origin = curr.origin || 'other';
            if (!acc[key]) {
                acc[key] = {
                    key,
                    month: `${MONTHS_SHORT[monthNumber - 1]} ${String(year).slice(-2)}`,
                    origins: {},
                    total: 0,
                };
            }
            acc[key].origins[origin] = (acc[key].origins[origin] || 0) + price;
            acc[key].total += price;
            return acc;
        }, {});
        const allOrigins = new Set();
        Object.values(grouped).forEach(m => {
            Object.keys(m.origins).forEach(o => allOrigins.add(o));
        });
        const origins = Array.from(allOrigins).sort();
        const data = Object.values(grouped)
            .sort((a, b) => a.key.localeCompare(b.key))
            .map(item => {
                const row = { month: item.month, key: item.key, __total: item.total };
                origins.forEach(o => {
                    const sum = item.origins[o] || 0;
                    const pct = item.total > 0
                        ? Number(((sum / item.total) * 100).toFixed(2))
                        : 0;
                    row[o] = pct;
                    row[`${o}__sum`] = Number(sum.toFixed(2));
                });
                return row;
            });
        return { data, origins };
    }, [order]);

    // ============ ПО ДНЯМ ============
    const dailyStats = useMemo(() => {
        if (!filteredOrder.length) return [];
        const grouped = filteredOrder.reduce((acc, o) => {
            const d = new Date(o.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const price = parseFloat(o.price);
            if (isNaN(price)) return acc;
            acc[key] = (acc[key] || 0) + price;
            return acc;
        }, {});
        const sortedDates = filteredOrder.map(o => new Date(o.createdAt)).sort((a, b) => a - b);
        const startDate = new Date(sortedDates[0]);
        startDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = [];
        const cursor = new Date(startDate);
        while (cursor <= today) {
            const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
            const weekday = cursor.getDay() === 0 ? 6 : cursor.getDay() - 1;
            result.push({
                key,
                date: new Date(cursor),
                weekday,
                total: Number((grouped[key] || 0).toFixed(2)),
            });
            cursor.setDate(cursor.getDate() + 1);
        }
        const weeks = [];
        let currentWeek = { days: [], weekStart: null, weekTotal: 0 };
        result.forEach(day => {
            if (day.weekday === 0 && currentWeek.days.length > 0) {
                weeks.push(currentWeek);
                currentWeek = { days: [], weekStart: null, weekTotal: 0 };
            }
            if (currentWeek.days.length === 0 && day.weekday > 0) {
                for (let i = 0; i < day.weekday; i++) {
                    currentWeek.days.push({ empty: true });
                }
            }
            if (!currentWeek.weekStart) currentWeek.weekStart = day.date;
            currentWeek.days.push(day);
            currentWeek.weekTotal += day.total;
        });
        if (currentWeek.days.length > 0) {
            while (currentWeek.days.length < 7) {
                currentWeek.days.push({ empty: true });
            }
            weeks.push(currentWeek);
        }
        return [...weeks].reverse();
    }, [filteredOrder]);

    // ============ НОВЫЕ КЛИЕНТЫ ============
    const newClientsByMonth = useMemo(() => {
        if (!order.length) return [];
        const clientsWithOrders = new Set();
        const sortedOrders = [...order].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const grouped = sortedOrders.reduce((acc, o) => {
            const clientId = o.phone;
            const date = new Date(o.createdAt);
            const year = date.getFullYear();
            const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${monthNumber}`;
            if (!acc[key]) {
                acc[key] = { key, month: `${monthNumber}.${year}`, total: 0, ordersCount: 0 };
            }
            acc[key].ordersCount += 1;
            if (!clientId) return acc;
            if (!clientsWithOrders.has(clientId)) {
                acc[key].total += 1;
                clientsWithOrders.add(clientId);
            }
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => b.key.localeCompare(a.key));
    }, [order]);

    const newClientsChart = useMemo(() => {
        return [...newClientsByMonth]
            .reverse()
            .map(item => {
                const [y, m] = item.key.split('-');
                return {
                    month: `${MONTHS_SHORT[Number(m) - 1]} ${String(y).slice(-2)}`,
                    clients: item.total,
                    orders: item.ordersCount,
                };
            });
    }, [newClientsByMonth]);

    // Видимые недели
    const visibleWeeks = useMemo(() => {
        if (!dailyStats.length) return [];
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - daysPeriod);
        monthsAgo.setHours(0, 0, 0, 0);
        return dailyStats.filter(w => w.weekStart && w.weekStart >= monthsAgo);
    }, [dailyStats, daysPeriod]);

    // Пороги для цветовой шкалы
    const intensityThresholds = useMemo(() => {
        const values = dailyStats
            .flatMap(w => w.days.filter(d => !d.empty).map(d => d.total))
            .filter(v => v > 0)
            .sort((a, b) => a - b);
        if (!values.length) return [500, 2000, 5000];
        const p50 = values[Math.floor(values.length * 0.5)] || 100;
        const p75 = values[Math.floor(values.length * 0.75)] || 300;
        const p90 = values[Math.floor(values.length * 0.9)] || 800;
        return [p50, p75, p90];
    }, [dailyStats]);

    return (
        <div className="flex flex-col min-h-screen bg-[#F7F7F8]">
            <NavBar />
            <div className="flex-1 w-full min-w-0 mx-auto px-2 py-3 md:w-[90%] md:px-0 md:py-4">
                {/* Сводка */}
                <div className="mb-4 grid grid-cols-4 gap-0 overflow-hidden rounded-xl border border-[#E2E5E9] bg-white p-0 md:grid-cols-4 md:gap-3 md:border-0 md:bg-transparent md:p-0">
                    {[
                        ['Выручка', `${formatNumber(totalRevenue, 2)} р`, 'bi-currency-dollar'],
                        ['Заказов', formatNumber(totalOrders), 'bi-receipt'],
                        ['Клиентов', formatNumber(totalClients), 'bi-people'],
                        ['Средний чек', `${formatNumber(avgCheck, 2)} р`, 'bi-calculator'],
                    ].map(([label, value, icon], index) => (
                        <div key={label} title={label} className="min-w-0 border-r border-[#E8EBEF] last:border-r-0 px-1 py-2 text-center md:rounded-xl md:border md:border-[#E2E5E9] md:bg-white md:p-4 md:text-left">
                            <div className="flex items-center justify-center gap-1.5 text-[13px] text-[#6B7280] md:justify-start">
                                <i className={`bi ${icon} text-[#7890A8]`} /><span className="hidden md:inline">{label}</span>
                            </div>
                            <div className="mt-1 whitespace-nowrap text-[10px] font-semibold tabular-nums text-[#374151] sm:text-[13px] md:text-[24px]">
                                {loading ? '—' : value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ============ ТАБЫ + ПАНЕЛЬ ПЕРИОДА (в одну строку) ============ */}
                <div className="mb-4 flex w-full min-w-0 flex-col gap-2 rounded-xl border border-[#E2E5E9] bg-white p-2 md:hidden">
                    <select aria-label="Раздел" value={type} onChange={e => changeTab(e.target.value)} disabled={loading} className="w-full min-w-0 rounded-lg border border-[#E2E5E9] bg-[#F7F7F8] px-2 py-2 text-[13px] text-[#374151]">
                        {TABS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {showPeriodPanel && <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-1.5">
                        <select aria-label="Месяц" value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full min-w-0 rounded-md border border-[#E2E5E9] bg-white px-1.5 py-2 text-[12px] text-[#4B5563]">
                            {MONTHS_RU.map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{m.slice(0, 3)}</option>)}
                        </select>
                        <select aria-label="Год" value={startYear} onChange={e => setStartYear(e.target.value)} className="w-full min-w-0 rounded-md border border-[#E2E5E9] bg-white px-1.5 py-2 text-[12px] text-[#4B5563]">
                            {years.map(y => <option key={y}>{y}</option>)}
                        </select>
                        <select aria-label="Период" value={period} onChange={e => setPeriod(e.target.value)} className="w-full min-w-0 rounded-md border border-[#E2E5E9] bg-white px-1.5 py-2 text-[12px] text-[#4B5563]">
                            {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.value === 'all' ? 'Всё' : o.label}</option>)}
                        </select>
                    </div>}
                </div>
                <div className="mb-4 hidden flex-wrap items-center gap-3 md:flex">
                    {/* Табы */}
                    <div className="flex flex-nowrap max-w-full overflow-x-auto gap-1 bg-white border border-[#E2E5E9] rounded-lg p-1 md:flex-wrap">
                        {TABS.map(({ value, label, icon }) => {
                            const active = type === value;
                            return (
                                <button
                                    key={value}
                                    onClick={() => changeTab(value)}
                                    disabled={loading}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-md
                                            text-[12.5px] font-medium whitespace-nowrap
                                            transition-colors disabled:cursor-not-allowed
                                            ${active
                                                ? 'bg-[#EEF1F4] text-[#52677D]'
                                                : 'text-stone-600 hover:bg-stone-100'
                                            }`}
                                >
                                    <i className={`bi ${icon} text-[12px]`} />
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Панель периода — справа, в одну строку с табами */}
                    {!loading && showPeriodPanel && (
                        <div className="bg-white border border-[#E2E5E9] rounded-lg p-1 max-w-full
                                        flex items-center gap-2
                                        md:ml-auto
                                        overflow-x-auto">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400
                                             shrink-0 pl-2">
                                С
                            </span>
                            <FancySelect
                                value={startMonth}
                                onChange={e => setStartMonth(e.target.value)}
                                disabled={loading}
                                options={MONTHS_RU.map((name, i) => ({
                                    value: String(i + 1).padStart(2, '0'),
                                    label: name.slice(0, 3),
                                }))}
                                width="w-[80px] shrink-0"
                            />
                            <FancySelect
                                value={startYear}
                                onChange={e => setStartYear(e.target.value)}
                                disabled={loading}
                                options={years.map(y => ({ value: y, label: y }))}
                                width="w-[80px] shrink-0"
                            />
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400
                                             shrink-0 ml-1">
                                За
                            </span>
                            <FancySelect
                                value={period}
                                onChange={e => setPeriod(e.target.value)}
                                disabled={loading}
                                options={PERIOD_OPTIONS.map(o => ({
                                    value: o.value,
                                    label: o.value === 'all' ? 'Всё' : o.label,
                                }))}
                                width="w-[120px] shrink-0"
                            />
                        </div>
                    )}
                </div>


                {/* ============ ГРАФИК ============ */}
                {type === 'graphic' && (
                    <div className="flex flex-col gap-4">
                        {/* Доход по месяцам — столбиками */}
                        <div className="bg-white border border-[#E2E5E9] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-bar-chart-fill text-[13px] text-[#7890A8]" />
                                </span>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                    Доход по месяцам
                                </div>
                            </div>
                            <div style={{ width: '100%', height: 360 }}>
                                <ResponsiveContainer>
                                    <BarChart data={monthlySum} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="10 5" stroke="#e7e5e4" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 11, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                            interval={0}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis
                                            tickCount={8}
                                            tick={{ fontSize: 11, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                            tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}к` : v}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: '1px solid #e7e5e4',
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}
                                            formatter={(v, name) => [`${formatNumber(v, 2)} р`, name]}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar
                                            dataKey="total"
                                            fill="#7890A8"
                                            name="Фактический доход"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="projected"
                                            fill="#a8a29e"
                                            fillOpacity={0.5}
                                            name="Предполагаемый"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-3 text-[11px] text-stone-400 flex items-center gap-1">
                                <i className="bi bi-info-circle" />
                                Серый столбик — прогноз текущего месяца (по темпу дней).
                            </div>
                        </div>
                        {/* Источники заказов — % по месяцам (stacked bar) */}
                        <div className="bg-white border border-[#E2E5E9] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-pie-chart text-[13px] text-[#7890A8]" />
                                </span>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                    Источники заказов — доля в % по месяцам (без партнеров)
                                </div>
                            </div>
                            <div style={{ width: '100%', height: 340 }}>
                                <ResponsiveContainer>
                                    <BarChart
                                        data={originPercentData.data}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="10 5" stroke="#e7e5e4" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 11, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                            interval={0}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            ticks={[0, 25, 50, 75, 100]}
                                            tick={{ fontSize: 11, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                            tickFormatter={(v) => `${v}%`}
                                        />
                                        <Tooltip content={<OriginPercentTooltip />} />
                                        <Legend
                                            wrapperStyle={{ fontSize: 12 }}
                                            formatter={(value) => ORIGIN_LABELS[value] || value}
                                        />
                                        {originPercentData.origins.map((origin, i) => (
                                            <Bar
                                                key={origin}
                                                dataKey={origin}
                                                stackId="origins"
                                                fill={ORIGIN_COLORS[origin] || YEAR_COLORS[i % YEAR_COLORS.length]}
                                                name={origin}
                                                radius={i === originPercentData.origins.length - 1 ? [4, 4, 0, 0] : 0}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-3 text-[11px] text-stone-400 flex items-center gap-1">
                                <i className="bi bi-info-circle" />
                                Каждый столбик — 100%. Наведите, чтобы увидеть проценты и суммы.
                            </div>
                        </div>
                        {/* Новые клиенты vs Заказы */}
                        <div className="bg-white border border-[#E2E5E9] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-people text-[13px] text-[#7890A8]" />
                                </span>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                    Новые клиенты vs Заказы по месяцам
                                </div>
                            </div>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={newClientsChart} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="10 5" stroke="#e7e5e4" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 10, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                            interval={0}
                                            angle={-45}
                                            textAnchor="end"
                                            height={50}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: '1px solid #e7e5e4',
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar dataKey="clients" fill="#7890A8" name="Новые клиенты" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="orders" fill="#a8a29e" name="Все заказы" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
                {/* ============ ГРАФИК ============ */}
                {type === 'graphic' && (
                    <div className="flex flex-col gap-4">
                        {/* Доход по месяцам — столбиками (партнеры) */}
                        <div className="bg-white border border-[#E2E5E9] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-bar-chart-fill text-[13px] text-[#7890A8]" />
                                </span>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                    Доход по месяцам  (партнеры)
                                </div>
                            </div>
                            <div style={{ width: '100%', height: 360 }}>
                                <ResponsiveContainer>
                                    <BarChart data={monthlySumPartner} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="10 5" stroke="#e7e5e4" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 11, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                            interval={0}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis
                                            tickCount={8}
                                            tick={{ fontSize: 11, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                            tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}к` : v}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: '1px solid #e7e5e4',
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}
                                            formatter={(v, name) => [`${formatNumber(v, 2)} р`, name]}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar
                                            dataKey="total"
                                            fill="#7890A8"
                                            name="Фактический доход"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="projected"
                                            fill="#a8a29e"
                                            fillOpacity={0.5}
                                            name="Предполагаемый"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-3 text-[11px] text-stone-400 flex items-center gap-1">
                                <i className="bi bi-info-circle" />
                                Серый столбик — прогноз текущего месяца (по темпу дней).
                            </div>
                        </div>
                    </div>
                )}
                {/* ============ ПО ГОДАМ ============ */}
                {type === 'month' && (
                    <div className="flex flex-col gap-4">
                        {/* Таблица */}
                        <div className="bg-white border border-[#E2E5E9] rounded-xl overflow-hidden">
                            <div className="hidden md:flex items-center gap-2 px-4 py-3 bg-stone-50 border-b border-stone-200">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-calendar-month text-[13px] text-[#7890A8]" />
                                </span>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                    Суммы по месяцам за каждый год
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[12.5px] min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-stone-50/60 border-b border-stone-200
                                                    text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                            <th className="text-left px-4 py-2.5 sticky left-0 bg-stone-50/60">Год</th>
                                            {MONTHS_SHORT.map(m => (
                                                <th key={m} className="text-center px-2 py-2.5">{m}</th>
                                            ))}
                                            <th className="text-right px-4 py-2.5">Итого</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {ordersByYear.map(y => (
                                            <tr key={y.year} className="hover:bg-stone-50/60 transition-colors">
                                                <td className="px-4 py-2 font-bold text-[#374151] sticky left-0 bg-white">
                                                    {y.year}
                                                </td>
                                                {Array.from({ length: 12 }, (_, i) => {
                                                    const m = i + 1;
                                                    const val = y.months[m] || 0;
                                                    return (
                                                        <td
                                                            key={m}
                                                            className={`text-center px-2 py-2 tabular-nums
                                                                    ${val > 0
                                                                        ? 'text-stone-800 font-medium'
                                                                        : 'text-stone-300'
                                                                    }`}
                                                        >
                                                            {val > 0 ? formatNumber(Math.round(val)) : '—'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-2 text-right font-bold text-[#374151] tabular-nums
                                                                bg-stone-50/40">
                                                    {formatNumber(Math.round(y.total))}
                                                </td>
                                            </tr>
                                        ))}
                                        {ordersByYear.length === 0 && (
                                            <tr>
                                                <td colSpan={14} className="text-center py-8 text-stone-400">
                                                    Нет данных
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* LineChart: сравнение по месяцам за разные годы */}
                        <div className="hidden bg-white border border-[#E2E5E9] rounded-xl p-4 md:block">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-activity text-[13px] text-[#7890A8]" />
                                </span>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                    Сравнение по месяцам за разные годы
                                </div>
                                {recentYears.length > 0 && (
                                    <div className="ml-auto text-[11px] text-stone-400">
                                        {recentYears.length} последних года
                                    </div>
                                )}
                            </div>
                            <div style={{ width: '100%', height: 320 }}>
                                <ResponsiveContainer>
                                    <LineChart data={monthsCompareData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="10 5" stroke="#e7e5e4" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 11, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                            tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}к` : v}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: '1px solid #e7e5e4',
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}
                                            formatter={(v) => [`${formatNumber(v, 2)} р`, '']}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        {recentYears.map((year, i) => (
                                            <Line
                                                key={year}
                                                type="monotone"
                                                dataKey={`y${year}`}
                                                stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: YEAR_COLORS[i % YEAR_COLORS.length] }}
                                                activeDot={{ r: 5 }}
                                                name={String(year)}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        {/* === Графики === */}
                        <div className="hidden grid-cols-1 lg:grid-cols-2 gap-4 md:grid">
                            <div className="hidden bg-white border border-[#E2E5E9] rounded-xl p-4 md:block">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                        <i className="bi bi-bar-chart-fill text-[13px] text-[#7890A8]" />
                                    </span>
                                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                        Суммы по годам
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: 260 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={yearsChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="10 5" stroke="#e7e5e4" />
                                            <XAxis
                                                dataKey="year"
                                                tick={{ fontSize: 12, fill: '#78716c' }}
                                                axisLine={{ stroke: '#e7e5e4' }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: '#78716c' }}
                                                axisLine={{ stroke: '#e7e5e4' }}
                                                tickLine={false}
                                                tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}к` : v}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'white',
                                                    border: '1px solid #e7e5e4',
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                }}
                                                formatter={(v, name) => [`${formatNumber(v, 2)} р`, name]}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                            <Bar dataKey="total" fill="#7890A8" name="Выручка" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="projected" fill="#a8a29e" fillOpacity={0.5} name="Прогноз" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="hidden bg-white border border-[#E2E5E9] rounded-xl p-4 md:block">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                        <i className="bi bi-receipt text-[13px] text-[#7890A8]" />
                                    </span>
                                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                        Количество заказов по годам
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: 260 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={ordersYearsChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="10 5" stroke="#e7e5e4" />
                                            <XAxis
                                                dataKey="year"
                                                tick={{ fontSize: 12, fill: '#78716c' }}
                                                axisLine={{ stroke: '#e7e5e4' }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: '#78716c' }}
                                                axisLine={{ stroke: '#e7e5e4' }}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'white',
                                                    border: '1px solid #e7e5e4',
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                }}
                                                formatter={(v, name) => [v, name]}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                            <Bar dataKey="orders" fill="#646D78" name="Заказов" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="projected" fill="#a8a29e" fillOpacity={0.5} name="Прогноз" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* ============ ПО ДНЯМ ============ */}
                {type === 'day' && (
                    <div className="bg-white border border-[#E2E5E9] rounded-xl p-3 md:p-5">
                        <div className="hidden md:flex items-center justify-between gap-3 mb-4 md:mb-5 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-calendar-day text-[13px] text-[#7890A8]" />
                                </span>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                    Календарь дохода по дням
                                </div>
                            </div>
                            <div className="hidden items-center gap-3 text-[11px] text-stone-500 flex-wrap md:flex">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded bg-stone-100 border border-stone-200" />
                                    пусто
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded bg-[#7890A8]/15" />
                                    до {formatNumber(Math.round(intensityThresholds[0]))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded bg-[#7890A8]/40" />
                                    до {formatNumber(Math.round(intensityThresholds[1]))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded bg-[#7890A8]/70" />
                                    до {formatNumber(Math.round(intensityThresholds[2]))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded bg-[#7890A8]" />
                                    больше
                                </div>
                            </div>
                        </div>
                        <div className="w-full min-w-0 md:overflow-x-auto">
                            <div className="min-w-0 md:min-w-[640px]">
                                <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_minmax(0,1.45fr)] gap-0.5 md:grid-cols-[repeat(7,minmax(0,1fr))_110px] md:gap-1.5 mb-1.5">
                                    {WEEKDAYS_SHORT.map(d => (
                                        <div key={d} className="text-center py-1
                                                                text-[9px] md:text-[11px] uppercase font-semibold text-stone-400">
                                            {d}
                                        </div>
                                    ))}
                                    <div className="text-center py-1
                                                    text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                                        <span className="md:hidden">Итог</span><span className="hidden md:inline">Итог недели</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {visibleWeeks.map((week, wi) => (
                                        <div
                                            key={wi}
                                            className="grid grid-cols-[repeat(7,minmax(0,1fr))_minmax(0,1.45fr)] gap-0.5 md:grid-cols-[repeat(7,minmax(0,1fr))_110px] md:gap-1.5"
                                        >
                                            {week.days.map((day, di) => {
                                                if (day.empty) {
                                                    return <div key={di} className="h-11 md:h-auto md:aspect-square rounded-md md:rounded-lg bg-transparent" />;
                                                }
                                                const intensity =
                                                    day.total === 0 ? 0 :
                                                    day.total < intensityThresholds[0] ? 1 :
                                                    day.total < intensityThresholds[1] ? 2 :
                                                    day.total < intensityThresholds[2] ? 3 : 4;
                                                const bgClass = [
                                                    'bg-stone-50 hover:bg-stone-100 border border-stone-100',
                                                    'bg-[#7890A8]/15 border border-[#7890A8]/20',
                                                    'bg-[#7890A8]/35 border border-[#7890A8]/40',
                                                    'bg-[#7890A8]/65 border border-[#7890A8]/70',
                                                    'bg-[#7890A8] border border-[#7890A8]',
                                                ][intensity];
                                                const textClass = intensity >= 3 ? 'text-white' : 'text-stone-800';
                                                const subClass = intensity >= 3 ? 'text-white/80' : 'text-stone-500';
                                                return (
                                                    <div
                                                        key={di}
                                                        title={`${day.date.toLocaleDateString('ru-RU')}: ${formatNumber(day.total, 2)} р`}
                                                        className={`h-11 min-w-0 md:h-auto md:aspect-square rounded-md md:rounded-lg ${bgClass}
                                                                flex flex-col items-center justify-center
                                                                transition-colors cursor-default`}
                                                    >
                                                        <span className={`text-[10px] md:text-[11px] font-medium leading-none ${subClass}`}>
                                                            {day.date.getDate()}
                                                        </span>
                                                        {day.total > 0 && (
                                                            <span className={`mt-0.5 md:mt-1 text-[9px] sm:text-[11px] md:text-[15px] font-semibold md:font-bold leading-none tabular-nums ${textClass}`}>
                                                                {formatNumber(Math.round(day.total))}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <div className="h-11 min-w-0 md:h-auto md:aspect-square rounded-md md:rounded-lg bg-[#525A64]
                                                            flex flex-col items-center justify-center text-white">
                                                <span className="text-[8px] md:text-[10px] uppercase md:tracking-wider opacity-50">
                                                    {week.weekStart?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                                </span>
                                                <span className="text-[10px] md:text-[17px] font-bold mt-0.5 md:mt-1 tabular-nums leading-none">
                                                    {formatNumber(Math.round(week.weekTotal))}
                                                </span>
                                                <span className="hidden md:inline text-[10px] opacity-60 mt-0.5">р</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {visibleWeeks.length < dailyStats.length && (
                            <div className="mt-5 text-center">
                                <button
                                    onClick={() => setDaysPeriod(p => p + 6)}
                                    className="px-5 py-2.5 rounded-lg text-[13px] font-medium
                                            bg-white border border-stone-200 text-stone-700
                                            hover:bg-stone-50 hover:border-stone-300
                                            transition-colors
                                            inline-flex items-center gap-2"
                                >
                                    <i className="bi bi-arrow-down-circle" />
                                    Показать ещё 6 месяцев
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {/* ============ НОВЫЕ КЛИЕНТЫ ============ */}
                {type === 'newClientsMonth' && (
                    <div className="flex flex-col gap-4">
                        <div className="min-w-0 overflow-x-auto max-md:[&_table]:w-full max-md:[&_*:has(>table)>div:not(:has(table))]:hidden max-md:[&_*:has(>div>table)>div:not(:has(table))]:hidden"><NewClientsTable newClientsByMonth={newClientsByMonth} /></div>
                        <div className="hidden bg-white border border-[#E2E5E9] rounded-xl p-4 md:block">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-bar-chart text-[13px] text-[#7890A8]" />
                                </span>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                    Новые клиенты по месяцам
                                </div>
                            </div>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={newClientsChart}>
                                        <CartesianGrid strokeDasharray="10 5" stroke="#e7e5e4" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 10, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                            interval={0}
                                            angle={-45}
                                            textAnchor="end"
                                            height={50}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#78716c' }}
                                            axisLine={{ stroke: '#e7e5e4' }}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: '1px solid #e7e5e4',
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}
                                        />
                                        <Bar dataKey="clients" fill="#7890A8" name="Новые клиенты" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
                {type === 'materials' && (
                    <MaterialTab startYear={startYear} startMonth={startMonth} period={period} />
                )}
            </div>
        </div>
    );
};
export default Statistic;
