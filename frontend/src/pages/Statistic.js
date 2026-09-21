import { useEffect, useState, useMemo } from 'react';
import { $host } from "../http";
import { NavBar } from "../components/admin/NavBar";
import Footer from "../components/admin/Footer";
import { toast } from 'sonner';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, BarChart, Bar,
} from 'recharts';

// ============ ХЕЛПЕРЫ ============
const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const MONTHS_RU = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const PERIOD_OPTIONS = [
    { value: '1',   label: 'Месяц',     months: 1 },
    { value: '3',   label: '3 мес.',    months: 3 },
    { value: '6',   label: '6 мес.',    months: 6 },
    { value: '12',  label: 'Год',       months: 12 },
    { value: 'all', label: 'Всё время', months: null },
];

// Палитра для линий по годам
const YEAR_COLORS = ['#0D9488', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#ec4899', '#6366f1'];

// Палитра для источников заказов
const ORIGIN_COLORS = {
    site: '#0D9488',
    telegram: '#06b6d4',
    instagram: '#ec4899',
    vk: '#6366f1',
    whatsapp: '#84cc16',
    phone: '#f59e0b',
    office: '#8b5cf6',
    other: '#a8a29e',
};
const ORIGIN_LABELS = {
    site: 'Сайт',
    telegram: 'Telegram',
    instagram: 'Instagram',
    vk: 'VK',
    whatsapp: 'WhatsApp',
    phone: 'Телефон',
    office: 'Офис',
    other: 'Другое',
};

const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return '0';
    const fixed = Number(num).toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
};

// ============ РАСЧЁТ ДИАПАЗОНА ПО ВЫБРАННОМУ ПЕРИОДУ ============
const getPeriodRange = (startYear, startMonth, periodOption) => {
    const from = new Date(Number(startYear), Number(startMonth) - 1, 1, 0, 0, 0, 0);

    if (periodOption.months === null) {
        const to = new Date();
        to.setHours(23, 59, 59, 999);
        return { from, to };
    }

    const to = new Date(from);
    to.setMonth(to.getMonth() + periodOption.months);
    to.setMilliseconds(-1);

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (to > today) {
        return { from, to: today };
    }

    return { from, to };
};

// ============ КАСТОМНЫЙ ТУЛТИП ДЛЯ % ГРАФИКА ============
const OriginPercentTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const total = payload.reduce((s, p) => {
        const value = Number(p.payload?.[`${p.dataKey}__sum`] ?? 0);
        return s + value;
    }, 0);

    const sorted = [...payload]
        .filter(p => Number(p.value) > 0)
        .sort((a, b) => Number(b.value) - Number(a.value));

    return (
        <div style={{
            background: 'white',
            border: '1px solid #e7e5e4',
            borderRadius: 8,
            fontSize: 12,
            padding: '8px 10px',
            minWidth: 200,
        }}>
            <div style={{ fontWeight: 600, color: '#2C3531', marginBottom: 6 }}>
                {label}
            </div>
            <div style={{ color: '#78716c', marginBottom: 6, fontSize: 11 }}>
                Всего: <b style={{ color: '#2C3531' }}>{formatNumber(total, 2)} р</b>
            </div>
            {sorted.map(p => {
                const sum = Number(p.payload?.[`${p.dataKey}__sum`] ?? 0);
                return (
                    <div
                        key={p.dataKey}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 3,
                        }}
                    >
                        <span style={{
                            width: 8, height: 8, borderRadius: 2,
                            background: p.color, flexShrink: 0,
                        }} />
                        <span style={{ flex: 1, color: '#57534e' }}>
                            {ORIGIN_LABELS[p.dataKey] || p.dataKey}
                        </span>
                        <span style={{ fontWeight: 600, color: '#2C3531', fontVariantNumeric: 'tabular-nums' }}>
                            {Number(p.value).toFixed(1)}%
                        </span>
                        <span style={{ color: '#a8a29e', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>
                            {formatNumber(sum, 0)} р
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// ============ СВОДКА ============
const SummaryCard = ({ title, value, sub, icon }) => (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                <i className={`bi ${icon} text-[13px] text-[#0D9488]`} />
            </span>
            <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                {title}
            </div>
        </div>
        <div className="text-[20px] font-bold text-[#2C3531] tabular-nums whitespace-nowrap">
            {value}
        </div>
        {sub && <div className="text-[11px] text-stone-400 mt-0.5">{sub}</div>}
    </div>
);

// ============ СКЕЛЕТОН ============
const StatSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="h-3 w-24 rounded bg-stone-200 animate-pulse mb-3" />
                <div className="h-7 w-32 rounded bg-stone-200 animate-pulse" />
            </div>
        ))}
    </div>
);

// ============ ТАБЫ ============
const TABS = [
    { value: 'graphic',         label: 'График',            icon: 'bi-graph-up-arrow' },
    { value: 'month',           label: 'По годам',          icon: 'bi-calendar-month' },
    { value: 'day',             label: 'По дням',           icon: 'bi-calendar-day' },
    { value: 'newClientsMonth', label: 'Новые клиенты',     icon: 'bi-people' },
];

// ============ КАСТОМНЫЙ СЕЛЕКТ ============
const FancySelect = ({ value, onChange, options, disabled, width = 'w-[140px]' }) => (
    <div className={`relative ${width}`}>
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full appearance-none pl-3 pr-8 py-1.5
                    bg-white border border-stone-200 rounded-md
                    text-[12.5px] font-medium text-stone-800
                    cursor-pointer
                    transition-colors
                    hover:border-stone-300
                    focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20
                    disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
        <i className="bi bi-chevron-down
                    absolute right-2.5 top-1/2 -translate-y-1/2
                    text-[10px] text-stone-400
                    pointer-events-none" />
    </div>
);

// ============ ТАБЛИЦА НОВЫХ КЛИЕНТОВ ============
const NewClientsTable = ({ newClientsByMonth }) => {
    const clientsByYear = newClientsByMonth.reduce((acc, item) => {
        const [year, month] = item.key.split('-');
        if (!acc[year]) acc[year] = {};
        acc[year][Number(month)] = {
            newClients: item.total,
            ordersCount: item.ordersCount,
        };
        return acc;
    }, {});

    const years = Object.keys(clientsByYear).sort((a, b) => b - a);

    return (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-stone-50 border-b border-stone-200">
                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                    <i className="bi bi-people text-[13px] text-[#0D9488]" />
                </span>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                    Новые клиенты
                </div>
                <div className="ml-auto text-[11px] text-stone-400">
                    <span className="font-semibold text-stone-600">жирным</span> — новые,
                    <span className="text-stone-500"> (в скобках)</span> — все заказы
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[900px]">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-wider font-semibold text-stone-500
                                    border-b border-stone-200 bg-stone-50/60">
                            <th className="text-left px-4 py-2.5 sticky left-0 bg-stone-50/60">Год</th>
                            {MONTHS_SHORT.map(m => (
                                <th key={m} className="text-center px-2 py-2.5">{m}</th>
                            ))}
                            <th className="text-center px-4 py-2.5">Всего</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {years.map(year => {
                            const yearData = clientsByYear[year];
                            const yearTotal = Object.values(yearData).reduce(
                                (sum, m) => {
                                    sum.newClients += m.newClients;
                                    sum.ordersCount += m.ordersCount;
                                    return sum;
                                },
                                { newClients: 0, ordersCount: 0 }
                            );

                            return (
                                <tr key={year} className="hover:bg-stone-50/60 transition-colors">
                                    <td className="px-4 py-2.5 font-bold text-[#2C3531] sticky left-0 bg-white">
                                        {year}
                                    </td>

                                    {Array.from({ length: 12 }, (_, i) => {
                                        const monthNumber = i + 1;
                                        const monthData = yearData[monthNumber] || {
                                            newClients: 0,
                                            ordersCount: 0,
                                        };

                                        return (
                                            <td
                                                key={monthNumber}
                                                className={`text-center px-2 py-2.5 tabular-nums
                                                        ${monthData.newClients > 0
                                                            ? 'text-[#2C3531] font-medium'
                                                            : 'text-stone-300'
                                                        }`}
                                            >
                                                {monthData.newClients > 0 ? monthData.newClients : '—'}
                                                {monthData.ordersCount > 0 && (
                                                    <span className="text-stone-400 text-[11px] ml-0.5">
                                                        ({monthData.ordersCount})
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}

                                    <td className="text-center px-4 py-2.5 font-bold text-[#2C3531] tabular-nums
                                                    bg-stone-50/40">
                                        {yearTotal.newClients}
                                        <span className="text-stone-400 font-normal text-[11px] ml-0.5">
                                            ({yearTotal.ordersCount})
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}

                        {years.length === 0 && (
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
    );
};

// ============ ГЛАВНЫЙ КОМПОНЕНТ ============
const Statistic = () => {
    const [order, setOrder] = useState([]);
    const [type, setType] = useState('graphic');
    const [loading, setLoading] = useState(true);

    const [daysPeriod, setDaysPeriod] = useState(6);

    // ===== Период (для вкладок График / По годам / По дням) =====
    const now = new Date();
    const [startYear, setStartYear] = useState(String(now.getFullYear()));
    const [startMonth, setStartMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
    const [period, setPeriod] = useState('all');

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
    const showPeriodPanel = type === 'graphic' || type === 'month' || type === 'day';

    // ============ СВОДКА ============
    const totalRevenue = useMemo(() =>
        filteredOrder.reduce((s, o) => s + (Number(o.price) || 0), 0), [filteredOrder]);

    const totalOrders = filteredOrder.length;

    const totalClients = useMemo(() => {
        const set = new Set(filteredOrder.map(o => o.phone).filter(Boolean));
        return set.size;
    }, [filteredOrder]);

    const avgCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const daysSinceStart = useMemo(() => {
        if (!filteredOrder.length) return 0;
        const firstDate = filteredOrder.reduce((min, o) => {
            const d = new Date(o.createdAt);
            return d < min ? d : min;
        }, new Date());
        return Math.floor((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    }, [filteredOrder]);

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
        const grouped = filteredOrder.reduce((acc, curr) => {
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
    }, [filteredOrder]);

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
        <div className="flex flex-col min-h-screen bg-stone-100">

            <NavBar />

            <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">

                {/* Заголовок */}
                <div className="mb-6">
                    <h1 className="text-[24px] md:text-[30px] font-bold text-[#2C3531] leading-tight">
                        Статистика
                    </h1>
                </div>

                {/* Сводка */}
                {loading ? (
                    <div className="mb-6"><StatSkeleton /></div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        <SummaryCard
                            title="Выручка"
                            value={`${formatNumber(totalRevenue, 2)} р`}
                            sub={showPeriodPanel ? 'за период' : 'за всё время'}
                            icon="bi-currency-dollar"
                        />
                        <SummaryCard
                            title="Заказов"
                            value={formatNumber(totalOrders)}
                            sub={showPeriodPanel ? 'за период' : 'за всё время'}
                            icon="bi-receipt"
                        />
                        <SummaryCard
                            title="Клиентов"
                            value={formatNumber(totalClients)}
                            sub="уникальных"
                            icon="bi-people"
                        />
                        <SummaryCard
                            title="Средний чек"
                            value={`${formatNumber(avgCheck, 2)} р`}
                            sub="на заказ"
                            icon="bi-calculator"
                        />
                        <SummaryCard
                            title="Дней статистики"
                            value={formatNumber(daysSinceStart)}
                            sub="с первого заказа"
                            icon="bi-calendar-check"
                        />
                    </div>
                )}

                {/* ============ ТАБЫ + ПАНЕЛЬ ПЕРИОДА (в одну строку) ============ */}
                <div className="mb-6 flex flex-wrap items-center gap-3">

                    {/* Табы */}
                    <div className="flex flex-wrap gap-1.5 bg-white border border-stone-200 rounded-lg p-1">
                        {TABS.map(({ value, label, icon }) => {
                            const active = type === value;
                            return (
                                <button
                                    key={value}
                                    onClick={() => setType(value)}
                                    disabled={loading}
                                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md
                                            text-[12.5px] font-medium whitespace-nowrap
                                            transition-colors disabled:cursor-not-allowed
                                            ${active
                                                ? 'bg-[#2C3531] text-white'
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
                        <div className="bg-white border border-stone-200 rounded-lg p-1
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
                        <div className="bg-white border border-stone-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-bar-chart-fill text-[13px] text-[#0D9488]" />
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
                                            fill="#0D9488"
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
                        <div className="bg-white border border-stone-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-pie-chart text-[13px] text-[#0D9488]" />
                                </span>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                    Источники заказов — доля в % по месяцам
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
                        <div className="bg-white border border-stone-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-people text-[13px] text-[#0D9488]" />
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
                                        <Bar dataKey="clients" fill="#0D9488" name="Новые клиенты" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="orders" fill="#a8a29e" name="Все заказы" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============ ПО ГОДАМ ============ */}
                {type === 'month' && (
                    <div className="flex flex-col gap-4">
                        {/* Таблица */}
                        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 bg-stone-50 border-b border-stone-200">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-calendar-month text-[13px] text-[#0D9488]" />
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
                                                <td className="px-4 py-2 font-bold text-[#2C3531] sticky left-0 bg-white">
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
                                                <td className="px-4 py-2 text-right font-bold text-[#2C3531] tabular-nums
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
                        <div className="bg-white border border-stone-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-activity text-[13px] text-[#0D9488]" />
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            <div className="bg-white border border-stone-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                        <i className="bi bi-bar-chart-fill text-[13px] text-[#0D9488]" />
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
                                            <Bar dataKey="total" fill="#0D9488" name="Выручка" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="projected" fill="#a8a29e" fillOpacity={0.5} name="Прогноз" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white border border-stone-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                        <i className="bi bi-receipt text-[13px] text-[#0D9488]" />
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
                                            <Bar dataKey="orders" fill="#2C3531" name="Заказов" radius={[6, 6, 0, 0]} />
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
                    <div className="bg-white border border-stone-200 rounded-xl p-3 md:p-5">
                        <div className="flex items-center justify-between gap-3 mb-4 md:mb-5 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-calendar-day text-[13px] text-[#0D9488]" />
                                </span>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                    Календарь дохода по дням
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-stone-500 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded bg-stone-100 border border-stone-200" />
                                    пусто
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded bg-[#0D9488]/15" />
                                    до {formatNumber(Math.round(intensityThresholds[0]))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded bg-[#0D9488]/40" />
                                    до {formatNumber(Math.round(intensityThresholds[1]))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded bg-[#0D9488]/70" />
                                    до {formatNumber(Math.round(intensityThresholds[2]))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded bg-[#0D9488]" />
                                    больше
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0">
                            <div className="min-w-[640px]">
                                <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_110px] gap-1.5 mb-1.5">
                                    {WEEKDAYS_SHORT.map(d => (
                                        <div key={d} className="text-center py-1
                                                                text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                                            {d}
                                        </div>
                                    ))}
                                    <div className="text-center py-1
                                                    text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                                        Итог недели
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    {visibleWeeks.map((week, wi) => (
                                        <div
                                            key={wi}
                                            className="grid grid-cols-[repeat(7,minmax(0,1fr))_110px] gap-1.5"
                                        >
                                            {week.days.map((day, di) => {
                                                if (day.empty) {
                                                    return <div key={di} className="aspect-square rounded-lg bg-transparent" />;
                                                }

                                                const intensity =
                                                    day.total === 0 ? 0 :
                                                    day.total < intensityThresholds[0] ? 1 :
                                                    day.total < intensityThresholds[1] ? 2 :
                                                    day.total < intensityThresholds[2] ? 3 : 4;

                                                const bgClass = [
                                                    'bg-stone-50 hover:bg-stone-100 border border-stone-100',
                                                    'bg-[#0D9488]/15 border border-[#0D9488]/20',
                                                    'bg-[#0D9488]/35 border border-[#0D9488]/40',
                                                    'bg-[#0D9488]/65 border border-[#0D9488]/70',
                                                    'bg-[#0D9488] border border-[#0D9488]',
                                                ][intensity];

                                                const textClass = intensity >= 3 ? 'text-white' : 'text-stone-800';
                                                const subClass = intensity >= 3 ? 'text-white/80' : 'text-stone-500';

                                                return (
                                                    <div
                                                        key={di}
                                                        title={`${day.date.toLocaleDateString('ru-RU')}: ${formatNumber(day.total, 2)} р`}
                                                        className={`aspect-square rounded-lg ${bgClass}
                                                                flex flex-col items-center justify-center
                                                                transition-colors cursor-default`}
                                                    >
                                                        <span className={`text-[10px] md:text-[11px] font-medium leading-none ${subClass}`}>
                                                            {day.date.getDate()}
                                                        </span>
                                                        {day.total > 0 && (
                                                            <span className={`mt-0.5 md:mt-1 text-[12px] md:text-[15px] font-bold leading-none tabular-nums ${textClass}`}>
                                                                {formatNumber(Math.round(day.total))}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            <div className="aspect-square rounded-lg bg-[#2C3531]
                                                            flex flex-col items-center justify-center text-white">
                                                <span className="text-[9px] md:text-[10px] uppercase tracking-wider opacity-50">
                                                    {week.weekStart?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                                </span>
                                                <span className="text-[14px] md:text-[17px] font-bold mt-1 tabular-nums leading-none">
                                                    {formatNumber(Math.round(week.weekTotal))}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] opacity-60 mt-0.5">р</span>
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

                        <NewClientsTable newClientsByMonth={newClientsByMonth} />

                        <div className="bg-white border border-stone-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                                    <i className="bi bi-bar-chart text-[13px] text-[#0D9488]" />
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
                                        <Bar dataKey="clients" fill="#0D9488" name="Новые клиенты" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            <Footer />
        </div>
    );
};

export default Statistic;