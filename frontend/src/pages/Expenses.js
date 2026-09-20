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
    PieChart,
    Pie,
    Legend,
} from 'recharts';

// ============ БЫСТРЫЕ ПЕРИОДЫ (длительность от выбранной даты начала) ============
const PERIODS = [
    { value: '1',   label: 'Месяц',     short: 'Мес.',  months: 1 },
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

// Сумма без копеек, если они равны .00
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



// ============ ГРАФИК 1: ПО КАТЕГОРИЯМ (СТОЛБЦЫ) ============
const CategoryChart = ({ expenses, compact = false, hideHeader = false }) => {
    const dataByCategory = {};
    expenses.forEach(e => {
        dataByCategory[e.category] = (dataByCategory[e.category] || 0) + Number(e.amount);
    });

    let chartData = Object.entries(dataByCategory)
        .map(([key, value]) => {
            const cat = EXPENSE_CATEGORIES[key];
            return {
                key,
                name: cat?.name || key,
                color: cat?.color || '#a8a29e',
                value: Number(value.toFixed(2)),
            };
        })
        .sort((a, b) => b.value - a.value);

    // На мобилке — топ-5 + Прочее
    if (compact && chartData.length > 5) {
        const top = chartData.slice(0, 5);
        const rest = chartData.slice(5);
        const restSum = rest.reduce((s, e) => s + e.value, 0);
        top.push({
            key: '__other__',
            name: `Прочее (${rest.length})`,
            color: '#d6d3d1',
            value: Number(restSum.toFixed(2)),
        });
        chartData = top;
    }

    if (chartData.length === 0) return null;

    return (
        <div className={`bg-white border border-stone-200 rounded-xl w-full h-full flex flex-col
                        ${hideHeader ? 'p-0' : 'p-3 md:p-4'}`}>
            {!hideHeader && (
                <div className="flex items-center gap-2 mb-3 shrink-0">
                    <span className="w-7 h-7 rounded-md bg-stone-100
                                    flex items-center justify-center shrink-0">
                        <i className="bi bi-bar-chart text-[13px] text-[#0D9488]" />
                    </span>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                        По категориям
                    </div>
                </div>
            )}

            <div className={`flex-1 min-h-0 w-full ${hideHeader ? 'p-3' : ''}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 50, left: 0, bottom: 0 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            width={compact ? 100 : 150}
                            tick={{ fontSize: compact ? 11 : 12, fill: '#44403c' }}
                        />
                        <Tooltip
                            cursor={{ fill: '#fafaf9' }}
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e7e5e4',
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            formatter={(value) => [`${formatMoney(value)} р`, 'Сумма']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={compact ? 16 : 18}>
                            {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ============ ГРАФИК 2: КРУГОВАЯ ============
const PieChartByCategory = ({ expenses, compact = false, hideHeader = false }) => {
    const dataByCategory = {};
    expenses.forEach(e => {
        dataByCategory[e.category] = (dataByCategory[e.category] || 0) + Number(e.amount);
    });

    let chartData = Object.entries(dataByCategory)
        .map(([key, value]) => {
            const cat = EXPENSE_CATEGORIES[key];
            return {
                key,
                name: cat?.name || key,
                color: cat?.color || '#a8a29e',
                value: Number(value.toFixed(2)),
            };
        })
        .sort((a, b) => b.value - a.value);

    if (compact && chartData.length > 5) {
        const top = chartData.slice(0, 5);
        const rest = chartData.slice(5);
        const restSum = rest.reduce((s, e) => s + e.value, 0);
        top.push({
            key: '__other__',
            name: `Прочее (${rest.length})`,
            color: '#d6d3d1',
            value: Number(restSum.toFixed(2)),
        });
        chartData = top;
    }

    if (chartData.length === 0) return null;

    const total = chartData.reduce((sum, e) => sum + e.value, 0);

    const renderLabel = ({ percent }) => {
        if (percent < 0.05) return '';
        return `${Math.round(percent * 100)}%`;
    };

    return (
        <div className={`bg-white border border-stone-200 rounded-xl w-full h-full flex flex-col
                        ${hideHeader ? 'p-0' : 'p-3 md:p-4'}`}>
            {!hideHeader && (
                <div className="flex items-center gap-2 mb-3 shrink-0">
                    <span className="w-7 h-7 rounded-md bg-stone-100
                                    flex items-center justify-center shrink-0">
                        <i className="bi bi-pie-chart text-[13px] text-[#0D9488]" />
                    </span>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                        Структура расходов
                    </div>
                    <div className="ml-auto text-[11px] text-stone-400">
                        Всего: <b className="text-stone-700">{formatMoney(total)}</b>
                    </div>
                </div>
            )}

            <div className={`flex-1 min-h-0 w-full ${hideHeader ? 'p-2' : ''}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="72%"
                            innerRadius="45%"
                            paddingAngle={2}
                            label={renderLabel}
                            labelLine={false}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={index}
                                    fill={entry.color}
                                    stroke="white"
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e7e5e4',
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            formatter={(value, name) => [
                                `${formatMoney(value)} р (${Math.round(value / total * 100)}%)`,
                                name,
                            ]}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: 11 }}
                        />
                    </PieChart>
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
            className="w-full px-3 py-2 text-[13px] text-stone-800
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
            await $host.post('/api/expense/add', {
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
            <DialogContent className="w-[90%] max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[16px] font-semibold text-stone-900">
                        Новый расход
                    </DialogTitle>
                    <DialogDescription className="sr-only">Добавить</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-2">
                    <div>
                        <label className="text-[12px] text-stone-500 font-medium block mb-1">
                            Категория
                        </label>
                        <CategorySelect
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label className="text-[12px] text-stone-500 font-medium block mb-1">
                            Сумма (в рублях)
                        </label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            placeholder="1000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={saving}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-[12px] text-stone-500 font-medium block mb-1">
                            Заметка <span className="text-stone-400">(необязательно)</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="Например: для лаба"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={saving}
                            maxLength={200}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                    <button
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="px-4 py-2 rounded-md text-[13px] font-medium
                                text-stone-600 hover:bg-stone-100 transition-colors
                                disabled:opacity-50"
                    >
                        Отмена
                    </button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving || !amount}
                        className="px-4 py-2 bg-[#2C3531] hover:bg-[#3A4540] text-white
                                text-[13px] font-medium rounded-md
                                disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <i className="bi bi-arrow-repeat animate-spin mr-1" />
                                Сохранение...
                            </>
                        ) : 'Добавить'}
                    </Button>
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
            await $host.put(`/api/expense/update/${expense.id}`, {
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
            <DialogContent className="w-[90%] max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[16px] font-semibold text-stone-900">
                        Редактировать расход
                    </DialogTitle>
                    <DialogDescription className="sr-only">Изменить</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-2">
                    <div>
                        <label className="text-[12px] text-stone-500 font-medium block mb-1">
                            Категория
                        </label>
                        <CategorySelect
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label className="text-[12px] text-stone-500 font-medium block mb-1">
                            Сумма (в рублях)
                        </label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={saving}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-[12px] text-stone-500 font-medium block mb-1">
                            Заметка <span className="text-stone-400">(необязательно)</span>
                        </label>
                        <Input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={saving}
                            maxLength={200}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                    <button
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="px-4 py-2 rounded-md text-[13px] font-medium
                                text-stone-600 hover:bg-stone-100 transition-colors
                                disabled:opacity-50"
                    >
                        Отмена
                    </button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving || !amount}
                        className="px-4 py-2 bg-[#2C3531] hover:bg-[#3A4540] text-white
                                text-[13px] font-medium rounded-md
                                disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <i className="bi bi-arrow-repeat animate-spin mr-1" />
                                Сохранение...
                            </>
                        ) : 'Сохранить'}
                    </Button>
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
    const [sortBy, setSortBy] = useState('date_desc');

    const [mobileChart, setMobileChart] = useState('bar');

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

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
        $host.get('/api/expense/getAll', { params: buildParams() })
            .then(({ data }) => setExpenses(data))
            .catch(err => {
                console.error('Ошибка перезагрузки:', err);
            });
    };

    // ====== ЗАГРУЗКА ======
    useEffect(() => {
        setLoading(true);

        $host.get('/api/expense/getAll', { params: buildParams() })
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
            await $host.delete(`/api/expense/delete/${expense.id}`);
            toast.success('Расход удалён');
            reloadExpenses();
        } catch (err) {
            console.error('Ошибка удаления:', err);
            toast.error('Не удалось удалить расход');
        }
    };

    // ====== ФИЛЬТР / СОРТИРОВКА ======
    const filteredExpenses = useMemo(() => {
        if (groupFilter === 'all') return expenses;
        return expenses.filter(e => EXPENSE_CATEGORIES[e.category]?.group === groupFilter);
    }, [expenses, groupFilter]);

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
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalProduction = filteredExpenses
        .filter(e => EXPENSE_CATEGORIES[e.category]?.group === 'production')
        .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalAdmin = filteredExpenses
        .filter(e => EXPENSE_CATEGORIES[e.category]?.group === 'admin')
        .reduce((sum, e) => sum + Number(e.amount), 0);

    const hasData = !loading && filteredExpenses.length > 0;

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

                    {/* Кнопка «Добавить» — только на десктопе */}
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
                {/* Десктоп: 2 колонки в одной строке. Мобилка: фильтры одной строкой, тотал отдельно */}
                {/* ============ ПАНЕЛЬ ФИЛЬТРОВ + ТОТАЛ ============ */}
                <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4 md:items-stretch mb-3 md:mb-4">

                    {/* --- ПАНЕЛЬ ФИЛЬТРОВ --- */}
                    <div className="bg-white border border-stone-200 rounded-xl p-2.5 md:p-4
                                    h-full flex flex-col justify-center">

                        {/* Мобилка: одна строка */}
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

                        {/* Десктоп: две строки */}
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
                                        {formatMoney(totalProduction)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
                                    <span className="text-[11px] text-stone-500">Админ.</span>
                                    <span className="text-[12.5px] md:text-[13px] font-semibold text-stone-700 tabular-nums">
                                        {formatMoney(totalAdmin)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 ml-auto text-stone-400">
                                    <i className="bi bi-receipt text-[12px]" />
                                    <span className="text-[11px]">{filteredExpenses.length} шт.</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:block bg-white border border-stone-200 rounded-xl p-4" />
                    )}
                </div>

                {/* ============ ФИЛЬТР ГРУППЫ + СОРТИРОВКА ============ */}
                {hasData && (
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                        {/* Сегмент-кнопки с иконками */}
                        <div className="flex gap-1 bg-white border border-stone-200 rounded-lg p-1 flex-1 md:flex-none">
                            {GROUP_FILTERS.map(({ value, label, icon }) => {
                                const active = groupFilter === value;
                                return (
                                    <button
                                        key={value}
                                        onClick={() => setGroupFilter(value)}
                                        disabled={loading}
                                        className={`flex-1 md:flex-none
                                                inline-flex items-center justify-center gap-1.5
                                                px-3 py-1.5 rounded-md text-[12px] font-medium
                                                whitespace-nowrap transition-colors
                                                disabled:cursor-not-allowed
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

                        {/* Сортировка — иконка-кнопка */}
                        <div className="ml-auto">
                            <SortDropdown
                                value={sortBy}
                                onChange={setSortBy}
                                disabled={loading}
                            />
                        </div>
                    </div>
                )}

                {/* ============ ГРАФИКИ ============ */}
                {hasData && (
                    <>
                        {/* Десктоп: 2 графика в строку */}
                        <div className="hidden md:grid md:grid-cols-2 gap-4 mb-4">
                            <div style={{ height: 320 }}>
                                <CategoryChart expenses={filteredExpenses} />
                            </div>
                            <div style={{ height: 320 }}>
                                <PieChartByCategory expenses={filteredExpenses} />
                            </div>
                        </div>

                        {/* Мобилка: карточка с переключателем внутри и без дублирования заголовка */}
                        <div className="md:hidden mb-3">
                            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                                {/* Заголовок карточки с переключателем */}
                                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-stone-100">
                                    <span className="w-7 h-7 rounded-md bg-stone-100
                                                    flex items-center justify-center shrink-0">
                                        <i className={`bi ${mobileChart === 'bar' ? 'bi-bar-chart' : 'bi-pie-chart'}
                                                    text-[13px] text-[#0D9488]`} />
                                    </span>
                                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                                        По категориям
                                    </div>

                                    {/* Мини-табы */}
                                    <div className="ml-auto flex gap-1 bg-stone-100 rounded-md p-0.5">
                                        <button
                                            onClick={() => setMobileChart('bar')}
                                            className={`w-8 h-7 rounded flex items-center justify-center
                                                    transition-colors
                                                    ${mobileChart === 'bar'
                                                        ? 'bg-white text-[#0D9488] shadow-sm'
                                                        : 'text-stone-400'
                                                    }`}
                                            title="Столбцы"
                                        >
                                            <i className="bi bi-bar-chart text-[13px]" />
                                        </button>
                                        <button
                                            onClick={() => setMobileChart('pie')}
                                            className={`w-8 h-7 rounded flex items-center justify-center
                                                    transition-colors
                                                    ${mobileChart === 'pie'
                                                        ? 'bg-white text-[#0D9488] shadow-sm'
                                                        : 'text-stone-400'
                                                    }`}
                                            title="Круг"
                                        >
                                            <i className="bi bi-pie-chart text-[13px]" />
                                        </button>
                                    </div>
                                </div>

                                {/* График без внутреннего заголовка */}
                                <div style={{ height: 280 }}>
                                    {mobileChart === 'bar' && (
                                        <CategoryChart expenses={filteredExpenses} compact hideHeader />
                                    )}
                                    {mobileChart === 'pie' && (
                                        <PieChartByCategory expenses={filteredExpenses} compact hideHeader />
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

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
                        {/* Мобилка: карточки-строки */}
                        <div className="md:hidden flex flex-col gap-2">
                            {sortedExpenses.map(expense => {
                                const cat = EXPENSE_CATEGORIES[expense.category];
                                return (
                                    <div
                                        key={expense.id}
                                        className="bg-white border border-stone-200 rounded-xl p-3
                                                flex items-center gap-3"
                                    >
                                        {/* Иконка категории */}
                                        <span
                                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${cat?.color || '#a8a29e'}20` }}
                                        >
                                            <i
                                                className={`bi ${cat?.icon || 'bi-question'} text-[16px]`}
                                                style={{ color: cat?.color || '#a8a29e' }}
                                            />
                                        </span>

                                        {/* Текст */}
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

                                        {/* Сумма + действия */}
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
                                <table className="w-full text-[13px]" style={{ minWidth: 640 }}>
                                    <thead>
                                        <tr className="text-[10px] uppercase tracking-wider font-semibold text-stone-500
                                                    border-b border-stone-200 bg-stone-50">
                                            <th className="text-left px-4 py-3 w-[100px] whitespace-nowrap">Дата</th>
                                            <th className="text-left px-4 py-3 w-[200px] whitespace-nowrap">Категория</th>
                                            <th className="text-left px-4 py-3 whitespace-nowrap">Заметка</th>
                                            <th className="text-right px-4 py-3 w-[130px] whitespace-nowrap">Сумма</th>
                                            <th className="text-right px-4 py-3 w-[100px] whitespace-nowrap">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {sortedExpenses.map(expense => {
                                            const cat = EXPENSE_CATEGORIES[expense.category];

                                            return (
                                                <tr key={expense.id} className="hover:bg-stone-50/60 transition-colors">
                                                    <td className="px-4 py-3 text-stone-600 tabular-nums whitespace-nowrap">
                                                        {formatDate(expense.createdAt)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {cat ? (
                                                            <div className="inline-flex items-center gap-2 whitespace-nowrap">
                                                                <span
                                                                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                                                    style={{ backgroundColor: `${cat.color}20` }}
                                                                >
                                                                    <i
                                                                        className={`bi ${cat.icon} text-[11px]`}
                                                                        style={{ color: cat.color }}
                                                                    />
                                                                </span>
                                                                <span className="text-stone-700">{cat.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-stone-400 whitespace-nowrap">{expense.category}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">
                                                        {expense.title || <span className="text-stone-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-[#2C3531]
                                                                    tabular-nums whitespace-nowrap">
                                                        {formatMoney(expense.amount)} р
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
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
                    </>
                )}

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