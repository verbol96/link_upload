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

// Значения для селекта "За" (длительность)
const COUNT_OPTIONS = [
    { value: '1',   label: '1 мес.' },
    { value: '3',   label: '3 мес.' },
    { value: '6',   label: '6 мес.' },
    { value: '12',  label: '12 мес.' },
    { value: 'all', label: 'Всё время' },
];

const PAPER_LABELS = { glossy: 'Глянец', lustre: 'Люстр' };
const TYPE_LABELS = { photo: 'Фото', holst: 'Холст', magnit: 'Магнит' };

// ============ ОПИСАНИЕ ТАБЛИЦ ============
const SECTIONS = [
    {
        group: 'По количеству',
        tables: [
            { key: 'byFormat',            title: 'По форматам',         icon: 'bi-aspect-ratio' },
            { key: 'byPaper',             title: 'По типу бумаги',      icon: 'bi-layers',        labelMap: PAPER_LABELS },
            { key: 'byType',              title: 'По типу продукции',   icon: 'bi-box',           labelMap: TYPE_LABELS },
            { key: 'byFormatPaper',       title: 'Формат + бумага',     icon: 'bi-grid-3x3' },
        ],
    },
    {
        group: 'По выручке',
        tables: [
            { key: 'byFormatRevenue',     title: 'По форматам',         icon: 'bi-currency-bitcoin', isMoney: true },
            { key: 'byPaperRevenue',      title: 'По типу бумаги',      icon: 'bi-currency-bitcoin', labelMap: PAPER_LABELS, isMoney: true },
            { key: 'byTypeRevenue',       title: 'По типу продукции',   icon: 'bi-currency-bitcoin', labelMap: TYPE_LABELS, isMoney: true },
            { key: 'byFormatPaperRevenue', title: 'Формат + бумага',    icon: 'bi-currency-bitcoin', isMoney: true },
        ],
    },
];

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

// ============ ТАБЛИЦА (контент, без шапки) ============
const StatsTableContent = ({ rows, labelMap = {}, isMoney = false }) => {
    const total = rows.reduce((sum, r) => sum + r.value, 0);
    const fmt = (val) => isMoney ? `${formatNumber(val, 2)} р` : formatNumber(val, 0);

    if (rows.length === 0) {
        return (
            <div className="py-8 text-center text-[13px] text-stone-400">
                Нет данных за период
            </div>
        );
    }

    return (
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
    );
};

// ============ КАРТОЧКА-ТАБЛИЦА (мобилка, сворачиваемая) ============
const MobileStatsCard = ({ title, icon, rows, labelMap, isMoney }) => {
    const [open, setOpen] = useState(false);

    const total = rows.reduce((sum, r) => sum + r.value, 0);
    const fmt = (val) => isMoney ? `${formatNumber(val, 2)} р` : formatNumber(val, 0);

    return (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3
                           bg-stone-50 hover:bg-stone-100
                           border-b border-stone-200
                           transition-colors text-left cursor-pointer"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                        <i className={`bi ${icon} text-[13px] text-[#0D9488]`} />
                    </span>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500 truncate">
                        {title}
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="text-[12px] text-stone-400 whitespace-nowrap">
                        Всего: <b className="text-stone-700">{fmt(total)}</b>
                    </div>
                    <i className={`bi bi-chevron-${open ? 'up' : 'down'}
                                   text-[12px] text-stone-400`} />
                </div>
            </button>

            {open && <StatsTableContent rows={rows} labelMap={labelMap} isMoney={isMoney} />}
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

    // Выбранная таблица на десктопе
    const [activeKey, setActiveKey] = useState('byFormat');

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

    // Найти описание выбранной таблицы (для десктопа)
    const activeTable = useMemo(() => {
        for (const section of SECTIONS) {
            const found = section.tables.find(t => t.key === activeKey);
            if (found) return { ...found, group: section.group };
        }
        return null;
    }, [activeKey]);

    const activeRows = stats && activeTable ? (stats[activeTable.key] || []) : [];

    return (
        <div className="flex flex-col min-h-screen bg-stone-100">

            <NavBar />

            <div className="flex-1 w-full max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">

                {/* Заголовок */}
                <div className="mb-4 md:mb-6">
                    <h1 className="text-[22px] md:text-[30px] font-bold text-[#2C3531] leading-tight">
                        Статистика по бумаге
                    </h1>
                </div>

                {/* ============ ПАНЕЛЬ ФИЛЬТРОВ + ПОДПИСЬ ПЕРИОДА ============ */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-3 mb-4 md:mb-5">

                    {/* Панель фильтров — одна строка */}
                    <div className="bg-white border border-stone-200 rounded-xl p-2.5 md:p-3
                                    flex items-center gap-2
                                    overflow-x-auto">

                        {/* Метка "С" */}
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 shrink-0">
                            С
                        </span>

                        {/* Месяц */}
                        <FancySelect
                            value={startMonth}
                            onChange={e => setStartMonth(e.target.value)}
                            disabled={loading}
                            options={MONTHS_RU.map((name, i) => ({
                                value: String(i + 1).padStart(2, '0'),
                                label: name.slice(0, 3),
                            }))}
                            width="w-[80px] md:w-[140px] shrink-0"
                        />

                        {/* Год */}
                        <FancySelect
                            value={startYear}
                            onChange={e => setStartYear(e.target.value)}
                            disabled={loading}
                            options={years.map(y => ({ value: y, label: y }))}
                            width="w-[80px] md:w-[90px] shrink-0"
                        />

                        {/* Метка "За" */}
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 shrink-0 ml-1">
                            За
                        </span>

                        {/* Период */}
                        <FancySelect
                            value={count}
                            onChange={e => setCount(e.target.value)}
                            disabled={loading}
                            options={COUNT_OPTIONS.map(o => ({
                                value: o.value,
                                label: o.value === 'all' ? 'Всё' : o.label,
                            }))}
                            width="flex-1 md:flex-none md:w-[140px] min-w-0"
                        />
                    </div>

                    {/* Подпись периода */}
                    {stats?.period && !loading && (
                        <div className="flex md:justify-end shrink-0">
                            <div className="inline-flex items-center gap-1.5
                                            text-[12px] text-stone-500
                                            bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5
                                            whitespace-nowrap">
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

                        {/* ============ МОБИЛКА: карточки в 2 колонки ============ */}
                        <div className="lg:hidden">
                            <div className="mb-3 text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                                По количеству
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                                {SECTIONS[0].tables.map(t => (
                                    <MobileStatsCard
                                        key={t.key}
                                        title={t.title}
                                        icon={t.icon}
                                        rows={stats[t.key] || []}
                                        labelMap={t.labelMap}
                                        isMoney={t.isMoney}
                                    />
                                ))}
                            </div>

                            <div className="mb-3 text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                                По выручке
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {SECTIONS[1].tables.map(t => (
                                    <MobileStatsCard
                                        key={t.key}
                                        title={t.title}
                                        icon={t.icon}
                                        rows={stats[t.key] || []}
                                        labelMap={t.labelMap}
                                        isMoney={t.isMoney}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* ============ ДЕСКТОП: слева список, справа контент ============ */}
                        <div className="hidden lg:flex gap-4">

                            {/* Левая колонка — список таблиц */}
                            <aside className="w-[280px] shrink-0 bg-white border border-stone-200
                                              rounded-xl overflow-hidden">
                                {SECTIONS.map((section, sIdx) => (
                                    <div key={section.group}>
                                        <div className={`px-4 py-2 text-[10px] uppercase tracking-wider
                                                        font-semibold text-stone-400
                                                        bg-stone-50 border-b border-stone-200
                                                        ${sIdx > 0 ? 'border-t' : ''}`}>
                                            {section.group}
                                        </div>

                                        {section.tables.map(t => {
                                            const active = activeKey === t.key;
                                            const rows = stats[t.key] || [];
                                            const total = rows.reduce((s, r) => s + r.value, 0);
                                            const fmtTotal = t.isMoney
                                                ? `${formatNumber(total, 2)} р`
                                                : formatNumber(total, 0);

                                            return (
                                                <button
                                                    key={t.key}
                                                    onClick={() => setActiveKey(t.key)}
                                                    className={`w-full text-left px-4 py-3
                                                                flex items-center gap-3
                                                                border-b border-stone-100 last:border-b-0
                                                                transition-colors
                                                                ${active
                                                                    ? 'bg-[#0D9488]/5'
                                                                    : 'hover:bg-stone-50'
                                                                }`}
                                                >
                                                    {/* Иконка */}
                                                    <span className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0
                                                                    ${active
                                                                        ? 'bg-[#0D9488]/10'
                                                                        : 'bg-stone-100'
                                                                    }`}>
                                                        <i className={`bi ${t.icon} text-[14px]
                                                                      ${active ? 'text-[#0D9488]' : 'text-stone-500'}`} />
                                                    </span>

                                                    {/* Текст + total */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-[13px] font-medium truncate
                                                                        ${active ? 'text-[#0D9488]' : 'text-stone-700'}`}>
                                                            {t.title}
                                                        </div>
                                                        <div className="text-[11px] text-stone-400 tabular-nums truncate mt-0.5">
                                                            Всего: <b className="text-stone-600">{fmtTotal}</b>
                                                        </div>
                                                    </div>

                                                    {/* Точка-индикатор */}
                                                    {active && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </aside>

                            {/* Правая колонка — контент выбранной таблицы */}
                            <main className="flex-1 min-w-0 bg-white border border-stone-200 rounded-xl overflow-hidden">
                                {activeTable && (
                                    <>
                                        {/* Шапка */}
                                        <div className="flex items-center justify-between px-4 py-3
                                                        bg-stone-50 border-b border-stone-200">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-7 h-7 rounded-md bg-stone-100
                                                                flex items-center justify-center shrink-0">
                                                    <i className={`bi ${activeTable.icon} text-[13px] text-[#0D9488]`} />
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="text-[10px] uppercase tracking-wider
                                                                    font-semibold text-stone-400">
                                                        {activeTable.group}
                                                    </div>
                                                    <div className="text-[14px] font-semibold text-stone-800 truncate">
                                                        {activeTable.title}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-[12px] text-stone-400 whitespace-nowrap">
                                                Всего:{' '}
                                                <b className="text-stone-700">
                                                    {activeTable.isMoney
                                                        ? `${formatNumber(activeRows.reduce((s, r) => s + r.value, 0), 2)} р`
                                                        : formatNumber(activeRows.reduce((s, r) => s + r.value, 0), 0)
                                                    }
                                                </b>
                                            </div>
                                        </div>

                                        {/* Контент */}
                                        <StatsTableContent
                                            rows={activeRows}
                                            labelMap={activeTable.labelMap}
                                            isMoney={activeTable.isMoney}
                                        />
                                    </>
                                )}
                            </main>
                        </div>
                    </>
                )}

            </div>

            <Footer />
        </div>
    );
};

export default Material;