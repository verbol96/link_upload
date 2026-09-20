import { useEffect, useState, useMemo } from 'react';
import { NavBar } from '../components/admin/NavBar';
import Footer from '../components/admin/Footer';
import { $host } from '../http';
import { toast } from 'sonner';

// ============ ФОРМАТИРОВАНИЕ ЧИСЕЛ ============
const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return '0';
    const fixed = Number(num).toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
};

const MONTHS_RU = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

// Кнопки количества месяцев
const COUNT_OPTIONS = [
    { value: '1',   label: '1 мес.' },
    { value: '3',   label: '3 мес.' },
    { value: '6',   label: '6 мес.' },
    { value: '12',  label: '12 мес.' },
    { value: 'all', label: 'Всё время' },
];

const PAPER_LABELS = { glossy: 'Глянец', lustre: 'Люстр' };
const TYPE_LABELS = { photo: 'Фото', holst: 'Холст', magnit: 'Магнит' };

// ============ СКЕЛЕТОН ============
const StatsSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="h-3 w-32 rounded bg-stone-200 animate-pulse mb-4" />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex justify-between mb-2">
                        <div className="h-3 w-24 rounded bg-stone-200 animate-pulse" />
                        <div className="h-3 w-12 rounded bg-stone-200 animate-pulse" />
                    </div>
                ))}
            </div>
        ))}
    </div>
);

// ============ ТАБЛИЦА ============
const StatsTable = ({ title, icon, rows, labelMap = {}, isMoney = false }) => {
    const total = rows.reduce((sum, r) => sum + r.value, 0);
    const fmt = (val) => isMoney ? `${formatNumber(val, 2)} р` : formatNumber(val, 0);

    return (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-200">
                <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                        <i className={`bi ${icon} text-[13px] text-[#0D9488]`} />
                    </span>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                        {title}
                    </div>
                </div>
                <div className="text-[12px] text-stone-400">
                    Всего: <b className="text-stone-700">{fmt(total)}</b>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-stone-400">
                    Нет данных за период
                </div>
            ) : (
                <table className="w-full text-[13px] table-auto">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-wider font-semibold text-stone-500
                                    border-b border-stone-100">
                            <th className="text-left px-4 py-2">Наименование</th>
                            <th className="text-right px-4 py-2 whitespace-nowrap">
                                {isMoney ? 'Сумма' : 'Кол-во'}
                            </th>
                            <th className="text-right px-4 py-2 whitespace-nowrap w-[60px]">%</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                        {rows.map((row, i) => {
                            const percent = total > 0 ? (row.value / total * 100).toFixed(1) : 0;
                            return (
                                <tr key={i} className="hover:bg-stone-50/60 transition-colors">
                                    <td className="px-4 py-2 text-stone-700">
                                        {labelMap[row.key] || row.key}
                                    </td>
                                    <td className="px-4 py-2 text-right font-semibold text-stone-900
                                                    tabular-nums whitespace-nowrap">
                                        {fmt(row.value)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-stone-400
                                                    tabular-nums whitespace-nowrap">
                                        {percent}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

// ============ КАСТОМНЫЙ СЕЛЕКТ ============
const FancySelect = ({ value, onChange, options, disabled, width = 'w-[140px]' }) => (
    <div className={`relative ${width}`}>
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full appearance-none pl-3 pr-8 py-2
                    bg-white border border-stone-200 rounded-lg
                    text-[13px] font-medium text-stone-800
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
                    absolute right-3 top-1/2 -translate-y-1/2
                    text-[11px] text-stone-400
                    pointer-events-none" />
    </div>
);

// ============ ГЛАВНЫЙ КОМПОНЕНТ ============
const Material = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Стартовый месяц: { year, month }
    const now = new Date();
    const [startYear, setStartYear] = useState(String(now.getFullYear()));
    const [startMonth, setStartMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));

    // Количество месяцев
    const [count, setCount] = useState('12');

    // Список годов
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const result = [];
        for (let y = currentYear; y >= 2020; y--) result.push(String(y));
        return result;
    }, []);

    // ====== ЗАГРУЗКА ======
    useEffect(() => {
        setLoading(true);

        const params = {};

        if (count === 'all') {
            // Всё время — без параметров
        } else {
            params.startMonth = `${startYear}-${startMonth}`;
            params.count = count;
        }

        $host.get('/api/order/getMaterialStats', { params })
            .then(({ data }) => setStats(data))
            .catch(err => {
                console.error('Ошибка загрузки:', err);
                toast.error('Не удалось загрузить статистику', {
                    description: err.response?.data?.error || 'Попробуйте позже',
                });
            })
            .finally(() => setLoading(false));
    }, [startYear, startMonth, count]);

    const fmtDate = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('ru-RU');
    };

    const periodLabel = () => {
        if (!stats?.period) return '';
        if (count === 'all' || !stats.period.from) {
            return 'За всё время';
        }
        return `Период: ${fmtDate(stats.period.from)} — ${fmtDate(stats.period.to)}`;
    };

    return (
        <div className="flex flex-col min-h-screen bg-stone-100">

            <NavBar />

            <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">

                {/* Заголовок */}
                <div className="mb-6">
                    <div className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold mb-1">
                        LINK · Склад
                    </div>
                    <h1 className="text-[24px] md:text-[30px] font-bold text-[#2C3531] leading-tight">
                        Учёт бумаги
                    </h1>
                </div>

                <div className='flex flex-row w-full justify-between'>
                    {/* Панель фильтров */}
                        <div className="mb-5 bg-white border border-stone-200 rounded-xl p-3
                                        flex flex-wrap items-center gap-3">

                            {/* Селекты: стартовый месяц */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                                    С
                                </span>

                                <FancySelect
                                    value={startMonth}
                                    onChange={e => setStartMonth(e.target.value)}
                                    disabled={loading}
                                    options={MONTHS_RU.map((name, i) => ({
                                        value: String(i + 1).padStart(2, '0'),
                                        label: name,
                                    }))}
                                    width="w-[140px]"
                                />

                                <FancySelect
                                    value={startYear}
                                    onChange={e => setStartYear(e.target.value)}
                                    disabled={loading}
                                    options={years.map(y => ({ value: y, label: y }))}
                                    width="w-[90px]"
                                />
                            </div>

                            {/* Разделитель */}
                            <div className="w-px h-8 bg-stone-200 mx-1 hidden md:block" />

                            {/* Пресеты: количество месяцев */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                {COUNT_OPTIONS.map(({ value, label }) => {
                                    const active = count === value;
                                    return (
                                        <button
                                            key={value}
                                            onClick={() => setCount(value)}
                                            disabled={loading || value === 'all' ? false : false}
                                            className={`px-3 py-2 rounded-lg text-[12.5px] font-medium
                                                    whitespace-nowrap transition-colors
                                                    disabled:cursor-not-allowed
                                                    ${active
                                                        ? 'bg-[#2C3531] text-white'
                                                        : 'text-stone-600 bg-stone-50 hover:bg-stone-100 border border-stone-200'
                                                    }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Подпись периода — выровнена справа под панелью */}
                        {stats?.period && !loading && (
                            <div className="mb-5 flex justify-end">
                                <div className="inline-flex items-center gap-1.5
                                                text-[12px] text-stone-500
                                                bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5">
                                    <i className="bi bi-calendar-range text-[12px] text-stone-400" />
                                    {periodLabel()}
                                </div>
                            </div>
                        )}

                </div>
   

                {/* Контент */}
                {loading ? (
                    <StatsSkeleton />
                ) : !stats ? (
                    <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
                        <i className="bi bi-exclamation-triangle text-[24px] text-stone-400 block mb-2" />
                        <div className="text-[14px] text-stone-500">
                            Не удалось загрузить статистику
                        </div>
                    </div>
                ) : (
                    <>

                        {/* Количество */}
                        <div className="mb-3 text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                            По количеству
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                            <StatsTable title="По форматам" icon="bi-aspect-ratio" rows={stats.byFormat} />
                            <StatsTable title="По типу бумаги" icon="bi-layers" rows={stats.byPaper} labelMap={PAPER_LABELS} />
                            <StatsTable title="По типу продукции" icon="bi-box" rows={stats.byType} labelMap={TYPE_LABELS} />
                            <StatsTable title="Формат + бумага" icon="bi-grid-3x3" rows={stats.byFormatPaper} />
                        </div>

                        {/* Выручка */}
                        <div className="mb-3 text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                            По выручке
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <StatsTable title="По форматам" icon="bi-currency-bitcoin" rows={stats.byFormatRevenue} isMoney />
                            <StatsTable title="По типу бумаги" icon="bi-currency-bitcoin" rows={stats.byPaperRevenue} labelMap={PAPER_LABELS} isMoney />
                            <StatsTable title="По типу продукции" icon="bi-currency-bitcoin" rows={stats.byTypeRevenue} labelMap={TYPE_LABELS} isMoney />
                            <StatsTable title="Формат + бумага" icon="bi-currency-bitcoin" rows={stats.byFormatPaperRevenue} isMoney />
                        </div>
                    </>
                )}

            </div>

            <Footer />
        </div>
    );
};

export default Material;