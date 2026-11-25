import { checkOrderEP, getOrderHistoryEP } from '../../http/epApi';
import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription
} from '../../ui/dialog';

import {
    Package,
    UserRound,
    Phone,
    MapPin,
    Copy,
    Check,
    AlertCircle,
    History
} from 'lucide-react';

const Section = ({ icon: Icon, title, children, extra }) => (
    <div className="min-w-0 rounded-xl border border-slate-200 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Icon size={17} className="shrink-0 text-slate-500" />
            {title}

            {extra != null && (
                <div className="ml-auto text-xs font-normal text-slate-400">
                    {extra}
                </div>
            )}
        </div>

        {children}
    </div>
);

const formatHistoryDate = (value) => {
    if (!value) return '—';

    const [date, time] = value.split(' ');
    const formattedDate = date.split('-').reverse().join('.');

    return time
        ? `${formattedDate} · ${time.slice(0, 5)}`
        : formattedDate;
};

const HistoryTimeline = ({ history, loading, error }) => (
    <Section
        icon={History}
        title="История отправления"
        extra={!loading && !error ? history.length : null}
    >
        {loading ? (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(item => (
                    <div key={item} className="flex gap-3">
                        <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-slate-200" />

                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-2/3 rounded bg-slate-100" />
                            <div className="h-2 w-1/3 rounded bg-slate-100" />
                        </div>
                    </div>
                ))}
            </div>
        ) : error ? (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                <AlertCircle size={16} className="shrink-0" />
                {error}
            </div>
        ) : !history.length ? (
            <div className="py-2 text-sm text-slate-400">
                История отправления пока отсутствует
            </div>
        ) : (
            <div className="pr-1">
                {history.map((item, index) => {
                    const isLatest = index === 0;
                    const isLast = index === history.length - 1;

                    return (
                        <div key={item.id} className="relative pl-6">
                            {!isLast && (
                                <div className="absolute bottom-0 left-[5px] top-2 w-px bg-slate-200" />
                            )}

                            <div
                                className={`absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 ${
                                    isLatest
                                        ? 'border-[#274C77] bg-[#274C77] ring-4 ring-[#274C77]/10'
                                        : 'border-slate-300 bg-white'
                                }`}
                            />

                            <div className={isLast ? 'pb-1' : 'pb-5'}>
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                    <span
                                        className={`text-sm font-medium ${
                                            isLatest
                                                ? 'text-[#274C77]'
                                                : 'text-slate-700'
                                        }`}
                                    >
                                        {item.status_to?.name || 'Неизвестный статус'}
                                    </span>

                                    <span className="whitespace-nowrap text-[11px] text-slate-400">
                                        {formatHistoryDate(item.created_at)}
                                    </span>
                                </div>

                                {item.info && (
                                    <div className="mt-1 break-words text-xs leading-relaxed text-slate-500">
                                        {item.info}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </Section>
);

const MyModalComponent = ({ isOpen, closeModal, codeOutside }) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        let active = true;

        setOrder(null);
        setHistory([]);
        setError('');
        setHistoryError('');
        setCopied(false);

        if (!codeOutside) {
            setLoading(false);
            setHistoryLoading(false);
            setError('Не указан трек-номер отправления');
            return;
        }

        setLoading(true);
        setHistoryLoading(true);

        const loadOrder = async () => {
            try {
                const data = await checkOrderEP(codeOutside);

                if (active) setOrder(data);
            } catch (error) {
                if (active) {
                    setError(
                        error.response?.data?.message ||
                        error.response?.data?.details?.message ||
                        'Не удалось получить информацию об отправлении'
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        const loadHistory = async () => {
            try {
                const data = await getOrderHistoryEP(codeOutside);

                if (!Array.isArray(data)) {
                    throw new Error('Некорректный формат истории');
                }

                const sorted = [...data].sort((a, b) =>
                    (b.created_at || '').localeCompare(a.created_at || '') ||
                    b.id - a.id
                );

                if (active) setHistory(sorted);
            } catch (error) {
                if (active) {
                    setHistoryError(
                        error.response?.data?.message ||
                        error.message ||
                        'Не удалось загрузить историю отправления'
                    );
                }
            } finally {
                if (active) setHistoryLoading(false);
            }
        };

        loadOrder();
        loadHistory();

        return () => {
            active = false;
        };
    }, [isOpen, codeOutside]);

    const copyNumber = async () => {
        try {
            await navigator.clipboard.writeText(codeOutside);
            setCopied(true);
        } catch (error) {
            console.error('Ошибка копирования:', error);
        }
    };

    const receiverName = [
        order?.receiver?.surname,
        order?.receiver?.name,
        order?.receiver?.patronymic_name
    ].filter(Boolean).join(' ');

    return (
        <Dialog
            open={isOpen}
            onOpenChange={open => {
                if (!open) closeModal();
            }}
        >
            <DialogContent className="w-[calc(100%-24px)] max-w-[680px] max-h-[90dvh] overflow-y-auto rounded-2xl p-5 sm:p-6">

                {/* Заголовок */}
                <div className="flex items-center gap-3 pr-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#274C77] text-white">
                        <Package size={25} strokeWidth={1.7} />
                    </div>

                    <div className="min-w-0">
                        <DialogDescription className="text-xs text-slate-500">
                            Отправление Европочты
                        </DialogDescription>

                        <DialogTitle className="mt-1 flex items-center gap-2 text-lg font-semibold">
                            {codeOutside}

                            <button
                                type="button"
                                onClick={copyNumber}
                                title="Копировать трек-номер"
                                aria-label="Копировать трек-номер"
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                {copied
                                    ? <Check size={15} className="text-green-600" />
                                    : <Copy size={15} />
                                }
                            </button>
                        </DialogTitle>
                    </div>
                </div>

                <div className="space-y-3">

                    {loading ? (
                        <div className="grid animate-pulse grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                            {[1, 2].map(item => (
                                <div key={item} className="space-y-4 p-4">
                                    <div className="h-3 w-24 rounded bg-slate-100" />
                                    <div className="h-4 w-4/5 rounded bg-slate-100" />
                                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                                    <div className="h-3 w-3/4 rounded bg-slate-100" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                            <AlertCircle size={20} className="shrink-0" />
                            {error}
                        </div>
                    ) : order && (

                        /* Информация об отправлении */
                        <div className="grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">

                            {/* Получатель */}
                            <div className="min-w-0 space-y-3 p-4">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <UserRound size={16} />
                                    
                                    <div className="text-base font-semibold text-black">
                                        {receiverName || '—'}
                                    </div>
                                    
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone
                                        size={14}
                                        className="shrink-0 text-slate-400"
                                    />

                                    {order.receiver?.phone_number
                                        ? `+${String(order.receiver.phone_number).replace(/^\+/, '')}`
                                        : 'Не указан'}
                                </div>

                                <div className="flex items-start gap-2 text-sm text-slate-600">
                                    <MapPin
                                        size={14}
                                        className="mt-0.5 shrink-0 text-slate-400"
                                    />

                                    <div className="min-w-0">
                                        <div className="leading-relaxed">
                                            {order.stores?.finish?.name || '—'}
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Отправление */}
                            <div className="min-w-0 space-y-3 p-4">
                                <div className="flex items-center justify-between gap-3">
    <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-500">
        <Package size={16} />
        Отправление
    </div>

    <div className="text-right text-base font-semibold text-black">
        {order.status?.name || 'Неизвестно'}
    </div>
</div>

                                <div className="flex items-center justify-between gap-2 text-sm">
                                    <span className="text-slate-500">
                                        Вес
                                    </span>

                                    <span className="shrink-0 font-medium text-slate-800">
                                        {order.weight != null
                                            ? `${order.weight} кг`
                                            : '—'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-2 text-sm">
                                    <span className="text-slate-500">
                                        Наложенный платёж
                                    </span>

                                    <span className="shrink-0 font-medium text-slate-800">
                                        {order.payment_amount != null
                                            ? `${order.payment_amount} р`
                                            : 'Нет данных'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* История отправления */}
                    {codeOutside && (
                        <HistoryTimeline
                            history={history}
                            loading={historyLoading}
                            error={historyError}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MyModalComponent;