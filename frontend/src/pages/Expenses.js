import { useEffect, useState, useMemo, useRef } from 'react';
import { NavBar } from '../components/admin/NavBar';
import Footer from '../components/admin/Footer';
import { $host } from '../http';
import { toast } from 'sonner';
import { EXPENSE_CATEGORIES, CATEGORY_GROUPS } from '../lib/expenseCategories';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList,
} from 'recharts';

// ============ БЫСТРЫЕ ПЕРИОДЫ ============
const PERIODS = [
    { value: '1',   label: 'Месяц',     short: 'Мес.',   months: 1 },
    { value: '3',   label: '3 мес.',    short: '3 мес.', months: 3 },
    { value: '6',   label: '6 мес.',    short: '6 мес.', months: 6 },
    { value: '12',  label: 'Год',       short: 'Год',    months: 12 },
    { value: 'all', label: 'Всё время', short: 'Всё',    months: null },
];

// ============ МЕСЯЦЫ ============
const MONTHS = [
    { value: '01', label: 'Январь',   short: 'Янв' },
    { value: '02', label: 'Февраль',  short: 'Фев' },
    { value: '03', label: 'Март',     short: 'Мар' },
    { value: '04', label: 'Апрель',   short: 'Апр' },
    { value: '05', label: 'Май',      short: 'Май' },
    { value: '06', label: 'Июнь',     short: 'Июн' },
    { value: '07', label: 'Июль',     short: 'Июл' },
    { value: '08', label: 'Август',   short: 'Авг' },
    { value: '09', label: 'Сентябрь', short: 'Сен' },
    { value: '10', label: 'Октябрь',  short: 'Окт' },
    { value: '11', label: 'Ноябрь',   short: 'Ноя' },
    { value: '12', label: 'Декабрь',  short: 'Дек' },
];

// ============ ФИЛЬТР ПО ГРУППЕ ============
const GROUP_FILTERS = [
    { value: 'all',        label: 'Все',     icon: 'bi-collection' },
    { value: 'production', label: 'Произв.', icon: 'bi-gear',      full: 'Производственные' },
    { value: 'admin',      label: 'Админ.',  icon: 'bi-building',  full: 'Административные' },
];

// ============ СОРТИРОВКА ============
const SORT_OPTIONS = [
    { value: 'date_desc',   label: 'Сначала новые', short: 'Новые' },
    { value: 'date_asc',    label: 'Сначала старые', short: 'Старые' },
    { value: 'amount_desc', label: 'Сумма ↓',        short: 'Сумма ↓' },
    { value: 'amount_asc',  label: 'Сумма ↑',        short: 'Сумма ↑' },
];

// ============ РАСЧЁТ ДИАПАЗОНА ============
const getPeriodRange = (startYear, startMonth, period) => {
    const from = new Date(Number(startYear), Number(startMonth) - 1, 1, 0, 0, 0, 0);

    if (period.months === null) {
        const to = new Date();
        to.setHours(23, 59, 59, 999);
        return { from, to };
    }

    const to = new Date(from);
    to.setMonth(to.getMonth() + period.months);
    to.setMilliseconds(-1);

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (to > today) {
        return { from, to: today };
    }

    return { from, to };
};

// ============ ФОРМАТИРОВАНИЕ ============
const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('ru-RU');
};

const formatDateShort = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
};

const formatMoney = (num) => {
    const n = Number(num) || 0;
    const hasCents = Math.round(n * 100) % 100 !== 0;
    return n.toLocaleString('ru-RU', {
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: 2,
    });
};

// ============ СКЕЛЕТОН ============
const ExpensesSkeleton = () => (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-stone-100 last:border-b-0">
                <div className="h-3 w-20 rounded bg-stone-200 animate-pulse" />
                <div className="h-3 w-32 rounded bg-stone-200 animate-pulse" />
                <div className="h-3 flex-1 rounded bg-stone-200 animate-pulse" />
                <div className="h-4 w-24 rounded bg-stone-300 animate-pulse" />
            </div>
        ))}
    </div>
);

// ============ ГРАФИК: ПО КАТЕГОРИЯМ ============
const CategoryChart = ({ expenses, compact = false, hideHeader = false }) => {
    const dataByCategory = {};
    expenses.forEach(e => {
        dataByCategory[e.category] = (dataByCategory[e.category] || 0) + Number(e.amount);
    });

    const total = Object.values(dataByCategory).reduce((sum, value) => sum + value, 0);
    const chartData = Object.entries(dataByCategory)
        .map(([key, value]) => {
            const cat = EXPENSE_CATEGORIES[key];
            return {
                key,
                name: cat?.name || key,
                color: cat?.color || '#a8a29e',
                value: Number(value.toFixed(2)),
                percent: total > 0 ? Math.round(value / total * 100) : 0,
                label: `${formatMoney(value)} р (${total > 0 ? Math.round(value / total * 100) : 0}%)`,
            };
        })
        .sort((a, b) => b.value - a.value);

    if (chartData.length === 0) return null;

    const chartHeight = Math.max(compact ? 280 : 320, chartData.length * (compact ? 42 : 46));
    const renderValueLabel = ({ x, y, width, height, value }) => (
        <text
            x={x + width + 8}
            y={y + height / 2}
            dy="0.35em"
            fill="#78716c"
            fontSize={compact ? 10 : 11}
            textAnchor="start"
        >
            {value}
        </text>
    );

    return (
        <div className={`bg-white border border-stone-200 rounded-xl w-full flex flex-col
                        ${hideHeader ? 'p-0' : 'p-3 md:p-4'}`}>
            {!hideHeader && (
                <div className="flex items-center gap-2 mb-3 shrink-0">
                    <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                        <i className="bi bi-bar-chart text-[13px] text-[#0D9488]" />
                    </span>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                        По категориям
                    </div>
                </div>
            )}

            <div className={`w-full ${hideHeader ? 'p-3' : ''}`} style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: compact ? 105 : 135, left: 0, bottom: 0 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            width={compact ? 105 : 155}
                            interval={0}
                            tick={{ fontSize: compact ? 11 : 12, fill: '#44403c' }}
                            tickFormatter={(value) => {
                                const maxLength = compact ? 16 : 20;
                                return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
                            }}
                        />
                        <Tooltip
                            cursor={{ fill: '#fafaf9' }}
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e7e5e4',
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            formatter={(value, name, props) => [
                                `${formatMoney(value)} р (${props.payload.percent}%)`,
                                'Сумма'
                            ]}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={compact ? 16 : 18}>
                            {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                            <LabelList dataKey="label" content={renderValueLabel} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ============ СЕЛЕКТ КАТЕГОРИЙ ============
const CategorySelect = ({ value, onChange, disabled }) => {
    const productionCats = Object.entries(EXPENSE_CATEGORIES)
        .filter(([, cat]) => cat.group === 'production');
    const adminCats = Object.entries(EXPENSE_CATEGORIES)
        .filter(([, cat]) => cat.group === 'admin');

    return (
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full px-3 py-2 text-[16px] md:text-[13px] text-stone-800
                    bg-stone-50 border border-stone-200 rounded-md
                    focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]
                    cursor-pointer"
        >
            <optgroup label={CATEGORY_GROUPS.production.name}>
                {productionCats.map(([key, cat]) => (
                    <option key={key} value={key}>{cat.name}</option>
                ))}
            </optgroup>
            <optgroup label={CATEGORY_GROUPS.admin.name}>
                {adminCats.map(([key, cat]) => (
                    <option key={key} value={key}>{cat.name}</option>
                ))}
            </optgroup>
        </select>
    );
};

// ============ МОДАЛКА: ДОБАВИТЬ ============
const AddExpenseModal = ({ open, onOpenChange, onAdded }) => {
    const [category, setCategory] = useState('photopaper');
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setCategory('photopaper');
            setAmount('');
            setTitle('');
            setSaving(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        const amountNum = Number(amount);
        if (!amountNum || amountNum <= 0) {
            toast.error('Введите сумму больше 0');
            return;
        }

        setSaving(true);
        try {
            await $host.post('api/expense/add', {
                category,
                amount: amountNum,
                title: title.trim() || null,
            });

            toast.success('Расход добавлен');
            onAdded();
            onOpenChange(false);
        } catch (err) {
            console.error('Ошибка добавления:', err);
            toast.error('Не удалось добавить расход');
        } finally {
            setSaving(false);
        }
    };

return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[92%] max-w-[420px] rounded-xl p-4 md:p-6">
            <DialogHeader>
                <DialogTitle className="text-[18px] font-semibold text-stone-800">
                    Добавить расход
                </DialogTitle>
                <DialogDescription className="text-[13px] text-stone-400">
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 mt-2">
                <div>
                    <label className="block mb-1.5 text-[12px] font-medium text-stone-500">
                        Категория
                    </label>
                    <CategorySelect
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={saving}
                    />
                </div>

                <div>
                    <label className="block mb-1.5 text-[12px] font-medium text-stone-500">
                        Сумма
                    </label>
                    <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={saving}
                        autoFocus
                        className="h-11 text-[16px] rounded-lg bg-stone-50 border-stone-200 focus:bg-white"
                    />
                </div>

                <div>
                    <label className="block mb-1.5 text-[12px] font-medium text-stone-500">
                        Заметка
                    </label>
                    <Input
                        type="text"
                        placeholder="Необязательно"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={saving}
                        maxLength={200}
                        className="h-11 text-[16px] rounded-lg bg-stone-50 border-stone-200 focus:bg-white"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="h-10 px-4 rounded-lg text-[14px]"
                    >
                        Отмена
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={saving || !amount}
                        className="h-10 px-5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-[14px]"
                    >
                        {saving ? 'Сохранение...' : 'Добавить'}
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
);
};

// ============ МОДАЛКА: РЕДАКТИРОВАТЬ ============
const EditExpenseModal = ({ open, onOpenChange, expense, onUpdated }) => {
    const [category, setCategory] = useState('photopaper');
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && expense) {
            setCategory(expense.category);
            setAmount(String(expense.amount));
            setTitle(expense.title || '');
            setSaving(false);
        }
    }, [open, expense]);

    const handleSubmit = async () => {
        const amountNum = Number(amount);
        if (!amountNum || amountNum <= 0) {
            toast.error('Введите сумму больше 0');
            return;
        }

        setSaving(true);
        try {
            await $host.put(`api/expense/update/${expense.id}`, {
                category,
                amount: amountNum,
                title: title.trim() || null,
            });

            toast.success('Расход обновлён');
            onUpdated();
            onOpenChange(false);
        } catch (err) {
            console.error('Ошибка обновления:', err);
            toast.error('Не удалось обновить расход');
        } finally {
            setSaving(false);
        }
    };

return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[92%] max-w-[420px] rounded-xl p-4 md:p-6">
            <DialogHeader>
                <DialogTitle className="text-[18px] font-semibold text-stone-800">
                    Редактировать расход
                </DialogTitle>
                <DialogDescription className="text-[13px] text-stone-400">
                    Измените данные расхода
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 mt-2">
                <div>
                    <label className="block mb-1.5 text-[12px] font-medium text-stone-500">
                        Категория
                    </label>
                    <CategorySelect
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={saving}
                    />
                </div>

                <div>
                    <label className="block mb-1.5 text-[12px] font-medium text-stone-500">
                        Сумма
                    </label>
                    <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={amount}
                        autoFocus
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={saving}
                        className="h-11 text-[16px] md:text-[14px] rounded-lg bg-stone-50 border-stone-200 focus:bg-white"
                    />
                </div>

                <div>
                    <label className="block mb-1.5 text-[12px] font-medium text-stone-500">
                        Заметка
                    </label>
                    <Input
                        type="text"
                        placeholder="Необязательно"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={saving}
                        maxLength={200}
                        className="h-11 text-[16px] md:text-[14px] rounded-lg bg-stone-50 border-stone-200 focus:bg-white"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="h-10 px-4 rounded-lg text-[14px]"
                    >
                        Отмена
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={saving || !amount}
                        className="h-10 px-5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-[14px]"
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
);
};

// ============ СОРТИРОВКА (выпадашка) ============
const SortDropdown = ({ value, onChange, disabled }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    const current = SORT_OPTIONS.find(o => o.value === value);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(v => !v)}
                disabled={disabled}
                className="w-10 h-10 rounded-lg bg-white border border-stone-200
                        flex items-center justify-center
                        text-stone-600 hover:bg-stone-50 transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Сортировка: ${current?.label || ''}`}
            >
                <i className="bi bi-sort-down text-[14px]" />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 z-30
                                bg-white border border-stone-200 rounded-lg shadow-lg
                                py-1 min-w-[170px]">
                    {SORT_OPTIONS.map(o => (
                        <button
                            key={o.value}
                            onClick={() => { onChange(o.value); setOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-[12.5px]
                                    transition-colors flex items-center gap-2
                                    ${o.value === value
                                        ? 'bg-[#0D9488]/10 text-[#0D9488] font-medium'
                                        : 'text-stone-700 hover:bg-stone-50'
                                    }`}
                        >
                            {o.value === value && <i className="bi bi-check2 text-[13px]" />}
                            {o.value !== value && <span className="w-[13px]" />}
                            {o.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ============ ОБЩАЯ КНОПКА «ПОКАЗАТЬ ЕЩЁ» ============
const ShowMoreButton = ({ onClick, hasMore, total, visible }) => {
    if (!hasMore) {
        if (total > 10) {
            return (
                <div className="text-center text-[11.5px] text-stone-400 py-3">
                    Показаны все {total}
                </div>
            );
        }
        return null;
    }

    return (
        <div className="text-center py-3">
            <button
                onClick={onClick}
                className="inline-flex items-center gap-2 px-5 py-2.5
                        bg-white border border-stone-200 rounded-lg
                        text-[13px] font-medium text-stone-700
                        hover:bg-stone-50 hover:border-stone-300
                        transition-colors"
            >
                <i className="bi bi-arrow-down-circle" />
                Показать ещё 10
            </button>
            <div className="text-[11px] text-stone-400 mt-2 tabular-nums">
                {visible} из {total}
            </div>
        </div>
    );
};

// ============ ОСНОВНАЯ СТРАНИЦА ============
const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
    const [selectedMonth, setSelectedMonth] = useState(
        String(now.getMonth() + 1).padStart(2, '0')
    );

    const [period, setPeriod] = useState(
        PERIODS.find(p => p.value === '1')
    );

    const [groupFilter, setGroupFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');

    const [mobileView, setMobileView] = useState('list');

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    // ====== ПАГИНАЦИЯ ======
    const PAGE_SIZE = 10;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // ====== ПАРАМЕТРЫ ЗАПРОСА ======
    const buildParams = () => {
        const params = {};
        const { from, to } = getPeriodRange(selectedYear, selectedMonth, period);
        if (from) params.from = from.toISOString();
        if (to) params.to = to.toISOString();
        return params;
    };

    // ====== ПЕРЕЗАГРУЗКА ======
    const reloadExpenses = () => {
        $host.get('api/expense/getAll', { params: buildParams() })
            .then(({ data }) => {
                setExpenses(data);
                setVisibleCount(PAGE_SIZE);
            })
            .catch(err => {
                console.error('Ошибка перезагрузки:', err);
            });
    };

    // ====== ЗАГРУЗКА ======
    useEffect(() => {
        setLoading(true);
        setVisibleCount(PAGE_SIZE);

        $host.get('api/expense/getAll', { params: buildParams() })
            .then(({ data }) => setExpenses(data))
            .catch(err => {
                console.error('Ошибка загрузки:', err);
                toast.error('Не удалось загрузить расходы');
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedMonth, period]);

    // ====== ДОБАВЛЕНИЕ / ОБНОВЛЕНИЕ / УДАЛЕНИЕ ======
    const handleAdded = () => reloadExpenses();

    const handleEditClick = (expense) => {
        setEditingExpense(expense);
        setEditModalOpen(true);
    };

    const handleUpdated = () => reloadExpenses();

    const handleDelete = async (expense) => {
        const ok = window.confirm(
            `Удалить расход?\n\n` +
            `Категория: ${EXPENSE_CATEGORIES[expense.category]?.name || expense.category}\n` +
            `Сумма: ${formatMoney(expense.amount)} р`
        );
        if (!ok) return;

        try {
            await $host.delete(`api/expense/delete/${expense.id}`);
            toast.success('Расход удалён');
            reloadExpenses();
        } catch (err) {
            console.error('Ошибка удаления:', err);
            toast.error('Не удалось удалить расход');
        }
    };

    // ====== ФИЛЬТРЫ ГРАФИКОВ / СПИСКА + СОРТИРОВКА ======
    const chartExpenses = useMemo(() => {
        if (groupFilter === 'all') return expenses;
        return expenses.filter(e => EXPENSE_CATEGORIES[e.category]?.group === groupFilter);
    }, [expenses, groupFilter]);

    const filteredExpenses = useMemo(() => {
        if (categoryFilter === 'all') return chartExpenses;
        return chartExpenses.filter(e => e.category === categoryFilter);
    }, [chartExpenses, categoryFilter]);

    const sortedExpenses = useMemo(() => {
        const arr = [...filteredExpenses];

        switch (sortBy) {
            case 'date_asc':
                return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'amount_desc':
                return arr.sort((a, b) => Number(b.amount) - Number(a.amount));
            case 'amount_asc':
                return arr.sort((a, b) => Number(a.amount) - Number(b.amount));
            case 'date_desc':
            default:
                return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }, [filteredExpenses, sortBy]);

    // ====== ПОДПИСЬ ДИАПАЗОНА ======
    const rangeLabel = useMemo(() => {
        const { from, to } = getPeriodRange(selectedYear, selectedMonth, period);
        if (!from || !to) return '';

        const fmt = (d) => d.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        return `${fmt(from)} — ${fmt(to)}`;
    }, [selectedYear, selectedMonth, period]);

    // ====== ИТОГО ======
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalProduction = expenses
        .filter(e => EXPENSE_CATEGORIES[e.category]?.group === 'production')
        .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalAdmin = expenses
        .filter(e => EXPENSE_CATEGORIES[e.category]?.group === 'admin')
        .reduce((sum, e) => sum + Number(e.amount), 0);
    const productionPercent = total > 0 ? Math.round(totalProduction / total * 100) : 0;
    const adminPercent = total > 0 ? Math.round(totalAdmin / total * 100) : 0;

    const hasData = !loading && expenses.length > 0;
    const chartHasData = !loading && chartExpenses.length > 0;

    // ====== СРЕЗ ДЛЯ ПОКАЗА ======
    const visibleExpenses = sortedExpenses.slice(0, visibleCount);

    // ====== СБРОС ПАГИНАЦИИ ПРИ СМЕНЕ ФИЛЬТРОВ ======
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [groupFilter, categoryFilter, sortBy]);

    return (
        <div className="flex flex-col min-h-screen bg-stone-100">

            <NavBar />

            <div className="flex-1 w-full max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 pb-24 md:pb-6">

                {/* Заголовок */}
                <div className="mb-4 md:mb-6 flex items-end justify-between gap-3 flex-wrap">
                    <div className="flex flex-row items-baseline gap-3 flex-wrap">
                        <h1 className="text-[22px] md:text-[30px] font-bold text-[#2C3531] leading-tight">
                            Расходы
                        </h1>
                        {rangeLabel && (
                            <div className="text-[11.5px] md:text-[13px] text-stone-400 tabular-nums">
                                {rangeLabel}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="hidden md:inline-flex items-center gap-2 px-4 py-2.5
                                bg-[#2C3531] hover:bg-[#3A4540] text-white
                                text-[13px] font-medium rounded-lg
                                transition-colors shadow-sm active:scale-95"
                    >
                        <i className="bi bi-plus-lg" />
                        Добавить
                    </button>
                </div>

                {/* ============ ПАНЕЛЬ ФИЛЬТРОВ + ТОТАЛ ============ */}
                <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4 md:items-stretch mb-3 md:mb-4">

                    {/* --- ПАНЕЛЬ ФИЛЬТРОВ --- */}
                    <div className="bg-white border border-stone-200 rounded-xl p-2.5 md:p-4
                                    h-full flex flex-col justify-center">

                        {/* Мобилка */}
                        <div className="md:hidden flex items-center gap-1.5">
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 shrink-0">
                                С
                            </div>

                            <div className="relative shrink-0">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    disabled={loading}
                                    className="appearance-none
                                            pl-2 pr-6 py-1.5
                                            bg-stone-50 border border-stone-200 rounded-md
                                            text-[12px] font-medium text-stone-700
                                            cursor-pointer
                                            focus:outline-none focus:border-[#0D9488]
                                            disabled:opacity-50"
                                >
                                    {MONTHS.map(m => (
                                        <option key={m.value} value={m.value}>{m.short}</option>
                                    ))}
                                </select>
                                <i className="bi bi-chevron-down
                                            absolute right-1.5 top-1/2 -translate-y-1/2
                                            text-[9px] text-stone-400
                                            pointer-events-none" />
                            </div>

                            <div className="relative shrink-0">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    disabled={loading}
                                    className="appearance-none
                                            pl-2 pr-6 py-1.5
                                            bg-stone-50 border border-stone-200 rounded-md
                                            text-[12px] font-medium text-stone-700
                                            cursor-pointer
                                            focus:outline-none focus:border-[#0D9488]
                                            disabled:opacity-50"
                                >
                                    {Array.from({ length: 5 }).map((_, i) => {
                                        const y = String(now.getFullYear() - i);
                                        return <option key={y} value={y}>{y}</option>;
                                    })}
                                </select>
                                <i className="bi bi-chevron-down
                                            absolute right-1.5 top-1/2 -translate-y-1/2
                                            text-[9px] text-stone-400
                                            pointer-events-none" />
                            </div>

                            <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 shrink-0 ml-1">
                                За
                            </div>

                            <div className="relative flex-1 min-w-0">
                                <select
                                    value={period.value}
                                    onChange={(e) => {
                                        const p = PERIODS.find(x => x.value === e.target.value);
                                        if (p) setPeriod(p);
                                    }}
                                    disabled={loading}
                                    className="appearance-none w-full
                                            pl-2 pr-6 py-1.5
                                            bg-stone-50 border border-stone-200 rounded-md
                                            text-[12px] font-medium text-stone-700
                                            cursor-pointer
                                            focus:outline-none focus:border-[#0D9488]
                                            disabled:opacity-50"
                                >
                                    {PERIODS.map(({ value, short }) => (
                                        <option key={value} value={value}>{short}</option>
                                    ))}
                                </select>
                                <i className="bi bi-chevron-down
                                            absolute right-1.5 top-1/2 -translate-y-1/2
                                            text-[9px] text-stone-400
                                            pointer-events-none" />
                            </div>
                        </div>

                        {/* Десктоп */}
                        <div className="hidden md:block">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 w-12 shrink-0">
                                    С
                                </div>

                                <div className="relative flex-1">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        disabled={loading}
                                        className="appearance-none w-full
                                                pl-3 pr-7 py-2
                                                bg-stone-50 border border-stone-200 rounded-lg
                                                text-[13px] font-medium text-stone-700
                                                cursor-pointer
                                                focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20
                                                disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {MONTHS.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                    <i className="bi bi-chevron-down
                                                absolute right-2.5 top-1/2 -translate-y-1/2
                                                text-[10px] text-stone-400
                                                pointer-events-none" />
                                </div>

                                <div className="relative w-[90px] shrink-0">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        disabled={loading}
                                        className="appearance-none w-full
                                                pl-3 pr-7 py-2
                                                bg-stone-50 border border-stone-200 rounded-lg
                                                text-[13px] font-medium text-stone-700
                                                cursor-pointer
                                                focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20
                                                disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {Array.from({ length: 5 }).map((_, i) => {
                                            const y = String(now.getFullYear() - i);
                                            return <option key={y} value={y}>{y}</option>;
                                        })}
                                    </select>
                                    <i className="bi bi-chevron-down
                                                absolute right-2.5 top-1/2 -translate-y-1/2
                                                text-[10px] text-stone-400
                                                pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 w-12 shrink-0">
                                    За
                                </div>

                                <div className="flex flex-1 flex-wrap gap-1.5">
                                    {PERIODS.map((p) => {
                                        const active = period.value === p.value;
                                        return (
                                            <button
                                                key={p.value}
                                                onClick={() => setPeriod(p)}
                                                disabled={loading}
                                                className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium
                                                        whitespace-nowrap transition-colors
                                                        disabled:cursor-not-allowed
                                                        ${active
                                                            ? 'bg-[#2C3531] text-white'
                                                            : 'text-stone-600 bg-stone-50 border border-stone-200 hover:bg-stone-100'
                                                        }`}
                                            >
                                                {p.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- КАРТОЧКА ТОТАЛА --- */}
                    {hasData ? (
                        <div className="bg-white border border-stone-200 rounded-xl p-3 md:p-4
                                        h-full flex flex-col justify-center">
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 mb-1">
                                Всего за период
                            </div>
                            <div className="text-[26px] md:text-[32px] font-bold text-[#2C3531]
                                            tabular-nums leading-none mb-2.5 md:mb-3">
                                {formatMoney(total)} <span className="text-stone-400 text-[18px] md:text-[22px]">₽</span>
                            </div>

                            <div className="flex items-center gap-3 md:gap-5 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                                    <span className="text-[11px] text-stone-500">Произв.</span>
                                    <span className="text-[12.5px] md:text-[13px] font-semibold text-stone-700 tabular-nums">
                                        {formatMoney(totalProduction)} <span className="text-stone-400 font-normal">({productionPercent}%)</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
                                    <span className="text-[11px] text-stone-500">Админ.</span>
                                    <span className="text-[12.5px] md:text-[13px] font-semibold text-stone-700 tabular-nums">
                                        {formatMoney(totalAdmin)} <span className="text-stone-400 font-normal">({adminPercent}%)</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 ml-auto text-stone-400">
                                    <i className="bi bi-receipt text-[12px]" />
                                    <span className="text-[11px]">{expenses.length} шт.</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:block bg-white border border-stone-200 rounded-xl p-4" />
                    )}
                </div>

                {/* ============ МЕНЮ ============ */}
                {expenses.length > 0 && (
                    <div className="bg-white border border-stone-200 rounded-xl p-2 md:p-2.5 mb-3 md:mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex gap-1 bg-stone-50 rounded-lg p-1 flex-1 md:flex-none">
                                {GROUP_FILTERS.map(({ value, label, icon }) => {
                                    const active = groupFilter === value;
                                    return (
                                        <button
                                            key={value}
                                            onClick={() => {
                                                setGroupFilter(value);
                                                setCategoryFilter('all');
                                            }}
                                            disabled={loading}
                                            className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1.5
                                                    px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap
                                                    transition-colors disabled:cursor-not-allowed
                                                    ${active
                                                        ? 'bg-[#0D9488] text-white'
                                                        : 'text-stone-600 hover:bg-stone-100'
                                                    }`}
                                        >
                                            <i className={`bi ${icon} text-[12px]`} />
                                            <span>{label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-1.5 flex-1 min-w-[170px] md:max-w-[330px]">
                                <div className="relative flex-1 min-w-0">
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        disabled={loading}
                                        className="appearance-none w-full h-9 pl-9 pr-8
                                                bg-white border border-stone-200 rounded-lg
                                                text-[12.5px] font-medium text-stone-700 cursor-pointer
                                                focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20
                                                disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="all">Все категории</option>
                                        {Object.entries(EXPENSE_CATEGORIES)
                                            .filter(([, cat]) => groupFilter === 'all' || cat.group === groupFilter)
                                            .map(([key, cat]) => (
                                                <option key={key} value={key}>{cat.name}</option>
                                            ))}
                                    </select>
                                    <i className="bi bi-funnel absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-stone-400 pointer-events-none" />
                                    <i className="bi bi-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 pointer-events-none" />
                                </div>
                                {categoryFilter !== 'all' && (
                                    <button
                                        onClick={() => setCategoryFilter('all')}
                                        className="w-9 h-9 rounded-lg border border-stone-200 bg-white
                                                flex items-center justify-center shrink-0
                                                text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
                                        title="Сбросить категорию"
                                    >
                                        <i className="bi bi-x-lg text-[12px]" />
                                    </button>
                                )}
                            </div>

                            <div className="ml-auto">
                                <SortDropdown value={sortBy} onChange={setSortBy} disabled={loading} />
                            </div>

                            <div className="md:hidden flex gap-1 bg-stone-100 rounded-lg p-1 w-full">
                                <button
                                    onClick={() => setMobileView('list')}
                                    className={`flex-1 h-8 rounded-md flex items-center justify-center gap-2 text-[12px] font-medium transition-colors
                                            ${mobileView === 'list'
                                                ? 'bg-white text-[#0D9488] shadow-sm'
                                                : 'text-stone-500'
                                            }`}
                                >
                                    <i className="bi bi-list-ul text-[13px]" />
                                    Список
                                </button>
                                <button
                                    onClick={() => setMobileView('chart')}
                                    className={`flex-1 h-8 rounded-md flex items-center justify-center gap-2 text-[12px] font-medium transition-colors
                                            ${mobileView === 'chart'
                                                ? 'bg-white text-[#0D9488] shadow-sm'
                                                : 'text-stone-500'
                                            }`}
                                >
                                    <i className="bi bi-bar-chart text-[13px]" />
                                    График
                                </button>
                            </div>
                        </div>

                    </div>
                )}

                <div className="md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] md:gap-4 md:items-start">
                    <div className={mobileView === 'list' ? 'block' : 'hidden md:block'}>
                {/* ============ СПИСОК РАСХОДОВ ============ */}
                {loading ? (
                    <ExpensesSkeleton />
                ) : filteredExpenses.length === 0 ? (
                    <div className="bg-white border border-stone-200 rounded-xl p-8 md:p-10 text-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full bg-stone-100
                                        flex items-center justify-center">
                            <i className="bi bi-cash-stack text-[22px] md:text-[26px] text-stone-400" />
                        </div>
                        <div className="text-[14px] md:text-[15px] font-medium text-stone-700 mb-1">
                            Расходов пока нет
                        </div>
                        <div className="text-[12px] md:text-[13px] text-stone-400 mb-4">
                            За выбранный период и фильтр ничего не найдено.
                        </div>
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2
                                    bg-[#2C3531] hover:bg-[#3A4540] text-white
                                    text-[13px] font-medium rounded-lg transition-colors"
                        >
                            <i className="bi bi-plus-lg" />
                            Добавить расход
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Мобилка: карточки */}
                        <div className="md:hidden flex flex-col gap-2">
                            {visibleExpenses.map(expense => {
                                const cat = EXPENSE_CATEGORIES[expense.category];
                                return (
                                    <div
                                        key={expense.id}
                                        className="bg-white border border-stone-200 rounded-xl p-3
                                                flex items-center gap-3"
                                    >
                                        <span
                                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${cat?.color || '#a8a29e'}20` }}
                                        >
                                            <i
                                                className={`bi ${cat?.icon || 'bi-question'} text-[16px]`}
                                                style={{ color: cat?.color || '#a8a29e' }}
                                            />
                                        </span>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13.5px] font-medium text-stone-800
                                                            truncate leading-tight">
                                                {cat?.name || expense.category}
                                            </div>
                                            <div className="text-[11.5px] text-stone-400
                                                            truncate leading-tight mt-0.5">
                                                {formatDateShort(expense.createdAt)}
                                                {expense.title && (
                                                    <>
                                                        <span className="mx-1.5 text-stone-300">·</span>
                                                        {expense.title}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <div className="text-[14px] font-bold text-[#2C3531]
                                                            tabular-nums whitespace-nowrap mr-1">
                                                {formatMoney(expense.amount)} <span className="text-stone-400 text-[11px]">₽</span>
                                            </div>
                                            <button
                                                onClick={() => handleEditClick(expense)}
                                                className="w-8 h-8 rounded-md
                                                        flex items-center justify-center
                                                        text-stone-400 active:text-[#0D9488] active:bg-[#0D9488]/10
                                                        transition-colors"
                                                title="Редактировать"
                                            >
                                                <i className="bi bi-pencil text-[13px]" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense)}
                                                className="w-8 h-8 rounded-md
                                                        flex items-center justify-center
                                                        text-stone-400 active:text-red-600 active:bg-red-50
                                                        transition-colors"
                                                title="Удалить"
                                            >
                                                <i className="bi bi-trash3 text-[13px]" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Десктоп: таблица */}
                        <div className="hidden md:block bg-white border border-stone-200 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed text-[13px]" style={{ minWidth: 640 }}>
                                    <thead>
                                        <tr className="text-[10px] uppercase tracking-wider font-semibold text-stone-500
                                                    border-b border-stone-200 bg-stone-50">
                                            <th className="text-left px-4 py-3 w-[115px] whitespace-nowrap">Дата</th>
                                            <th className="text-left px-4 py-3 w-[190px] whitespace-nowrap">Категория</th>
                                            <th className="text-left px-4 py-3">Заметка</th>
                                            <th className="text-right px-4 py-3 w-[100px] whitespace-nowrap">Сумма</th>
                                            <th className="text-right px-4 py-3 w-[120px] whitespace-nowrap">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {visibleExpenses.map(expense => {
                                            const cat = EXPENSE_CATEGORIES[expense.category];

                                            return (
                                                <tr key={expense.id} className="hover:bg-stone-50/60 transition-colors">
                                                    <td className="px-4 py-3 text-stone-600 tabular-nums whitespace-nowrap">
                                                        {formatDate(expense.createdAt)}
                                                    </td>
                                                    <td className="px-4 py-3 overflow-hidden">
                                                        {cat ? (
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span
                                                                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                                                    style={{ backgroundColor: `${cat.color}20` }}
                                                                >
                                                                    <i
                                                                        className={`bi ${cat.icon} text-[11px]`}
                                                                        style={{ color: cat.color }}
                                                                    />
                                                                </span>
                                                                <span className="text-stone-700 truncate block min-w-0" title={cat.name}>{cat.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-stone-400 truncate block" title={expense.category}>{expense.category}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-stone-600 overflow-hidden">
                                                        <div className="truncate" title={expense.title || ''}>
                                                            {expense.title || <span className="text-stone-300">—</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-[#2C3531]
                                                                    tabular-nums whitespace-nowrap">
                                                        {formatMoney(expense.amount)} р
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap w-[120px]">
                                                        <div className="inline-flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditClick(expense)}
                                                                className="w-7 h-7 rounded-md
                                                                        flex items-center justify-center
                                                                        text-stone-400 hover:text-[#0D9488] hover:bg-[#0D9488]/10
                                                                        transition-colors"
                                                                title="Редактировать"
                                                            >
                                                                <i className="bi bi-pencil text-[12px]" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(expense)}
                                                                className="w-7 h-7 rounded-md
                                                                        flex items-center justify-center
                                                                        text-stone-400 hover:text-red-600 hover:bg-red-50
                                                                        transition-colors"
                                                                title="Удалить"
                                                            >
                                                                <i className="bi bi-trash3 text-[12px]" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Кнопка «Показать ещё» */}
                        <ShowMoreButton
                            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                            hasMore={visibleCount < sortedExpenses.length}
                            total={sortedExpenses.length}
                            visible={Math.min(visibleCount, sortedExpenses.length)}
                        />
                    </>
                )}

                    </div>

                    <div className={mobileView === 'chart' ? 'block' : 'hidden md:block'}>
                        {chartHasData ? (
                            <>
                                <div className="hidden md:block">
                                    <CategoryChart expenses={chartExpenses} />
                                </div>
                                <div className="md:hidden">
                                    <CategoryChart expenses={chartExpenses} compact />
                                </div>
                            </>
                        ) : !loading ? (
                            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-[13px] text-stone-400">
                                Нет данных для графика
                            </div>
                        ) : null}
                    </div>
                </div>

            </div>

            {/* FAB на мобилке */}
            <button
                onClick={() => setAddModalOpen(true)}
                className="md:hidden fixed bottom-5 right-5 z-40
                        w-14 h-14 rounded-full
                        bg-[#2C3531] active:bg-[#3A4540]
                        text-white shadow-lg
                        flex items-center justify-center
                        transition-transform active:scale-95"
                title="Добавить расход"
            >
                <i className="bi bi-plus-lg text-[22px]" />
            </button>

            <AddExpenseModal
                open={addModalOpen}
                onOpenChange={setAddModalOpen}
                onAdded={handleAdded}
            />

            <EditExpenseModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                expense={editingExpense}
                onUpdated={handleUpdated}
            />

            <Footer />
        </div>
    );
};

export default Expenses;