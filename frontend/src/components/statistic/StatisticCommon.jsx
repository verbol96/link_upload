// Общие элементы страницы статистики
// ============ ХЕЛПЕРЫ ============
export const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const MONTHS_RU = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
export const PERIOD_OPTIONS = [
    { value: '1',   label: 'Месяц',     months: 1 },
    { value: '3',   label: '3 мес.',    months: 3 },
    { value: '6',   label: '6 мес.',    months: 6 },
    { value: '12',  label: 'Год',       months: 12 },
    { value: 'all', label: 'Всё время', months: null },
];
// Палитра для линий по годам
export const YEAR_COLORS = ['#0D9488', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#ec4899', '#6366f1'];
// Палитра для источников заказов
export const ORIGIN_COLORS = {
    site: '#0D9488',
    telegram: '#06b6d4',
    instagram: '#ec4899',
    vk: '#6366f1',
    whatsapp: '#84cc16',
    phone: '#f59e0b',
    office: '#8b5cf6',
    other: '#a8a29e',
};
export const ORIGIN_LABELS = {
    site: 'Сайт',
    telegram: 'Telegram',
    instagram: 'Instagram',
    vk: 'VK',
    whatsapp: 'WhatsApp',
    phone: 'Телефон',
    office: 'Офис',
    other: 'Другое',
};
export const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return '0';
    const fixed = Number(num).toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
};
// ============ РАСЧЁТ ДИАПАЗОНА ПО ВЫБРАННОМУ ПЕРИОДУ ============
export const getPeriodRange = (startYear, startMonth, periodOption) => {
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
export const OriginPercentTooltip = ({ active, payload, label }) => {
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
export const SummaryCard = ({ title, value, sub, icon }) => (
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
export const StatSkeleton = () => (
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
export const TABS = [
    { value: 'day',             label: 'По дням',           icon: 'bi-calendar-day' },
    { value: 'month',           label: 'По годам',          icon: 'bi-calendar-month' },
    { value: 'graphic',         label: 'График',            icon: 'bi-graph-up-arrow' },
    { value: 'newClientsMonth', label: 'Новые клиенты',     icon: 'bi-people' },
    { value: 'materials',       label: 'Материалы',         icon: 'bi-layers' },
];
// ============ КАСТОМНЫЙ СЕЛЕКТ ============
export const FancySelect = ({ value, onChange, options, disabled, width = 'w-[140px]' }) => (
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
export const NewClientsTable = ({ newClientsByMonth }) => {
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
