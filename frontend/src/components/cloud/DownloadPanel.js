import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    removeDownload,
    clearFinished,
    setProgress,
    setDone,
    setError,
} from '../../store/downloadsReducer';
import { downloadDir } from '../../store/fileReducer';
import { downloadFiles } from '../../http/cloudApi';

export const DownloadPanel = () => {
    const dispatch = useDispatch();
    const items = useSelector(state => state.downloads.items);
    const processingRef = useRef(false);
    const itemsRef = useRef(items);
    itemsRef.current = items;

    useEffect(() => {
        const processQueue = async () => {
            if (processingRef.current) return;
            const pending = itemsRef.current.find(i => i.status === 'pending');
            if (!pending) return;
            processingRef.current = true;

            try {
                await downloadFiles(
                    { id: pending.id, name: pending.name, type: pending.type },
                    (part, totalParts, percent, loadedMB) => {
                        dispatch(setProgress({ id: pending.id, progress: percent, part, totalParts, loadedMB }));
                    },
                    (part, totalParts) => {
                        dispatch(setDone({ id: pending.id, part, totalParts }));
                    }
                );
                // Обновляем карточки и счётчик после успешного завершения скачивания.
                dispatch(downloadDir(pending.id));
                window.dispatchEvent(new Event('link:cloud-files-changed'));
            } catch (err) {
                dispatch(setError({
                    id: pending.id,
                    error: err.message || 'Ошибка скачивания',
                }));
            } finally {
                processingRef.current = false;
                setTimeout(() => {
                    if (itemsRef.current.some(i => i.status === 'pending')) processQueue();
                }, 100);
            }
        };
        processQueue();
    }, [items, dispatch]);

    if (items.length === 0) return null;

    const doneCount = items.filter(i => i.status === 'done').length;
    const totalCount = items.length;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] w-80 max-w-[calc(100vw-2rem)]">
            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-inset ring-[#7890A8] shadow-xl shadow-slate-900/15">
                <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2 text-[13px] font-normal text-[#475569]">
                        <i className="bi bi-cloud-arrow-down text-[#7890A8]" />
                        <span>Загрузки{doneCount > 0 ? ` · ${doneCount}/${totalCount}` : ''}</span>
                    </div>
                    {doneCount > 0 && (
                        <button
                            type="button"
                            onClick={() => dispatch(clearFinished())}
                            className="text-[11px] font-normal text-[#64748B] transition-colors hover:text-[#274C77]"
                            title="Скрыть завершённые"
                        >
                            Очистить
                        </button>
                    )}
                </div>
                <div className="max-h-64 divide-y divide-[#F1F3F6] overflow-auto">
                    {items.slice().reverse().map(item => (
                        <DownloadRow
                            key={item.id}
                            item={item}
                            onRemove={() => dispatch(removeDownload(item.id))}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const DownloadRow = ({ item, onRemove }) => {
    const isDone = item.status === 'done';
    const isError = item.status === 'error';
    const isPending = item.status === 'pending';
    const totalParts = item.totalParts || 1;
    const currentPart = item.part || 1;
    const currentProgress = item.progress ?? 0;
    const overallProgress = isDone
        ? 100
        : totalParts > 1
            ? Math.round(((currentPart - 1) / totalParts) * 100 + currentProgress / totalParts)
            : currentProgress;

    return (
        <div className="flex items-start gap-2.5 px-4 py-3">
            <div className="mt-0.5 shrink-0 text-[14px]">
                {isDone ? (
                    <i className="bi bi-check-circle text-[#7890A8]" />
                ) : isError ? (
                    <i className="bi bi-exclamation-circle text-[#C46C6C]" />
                ) : isPending ? (
                    <i className="bi bi-clock text-[#94A3B8]" />
                ) : (
                    <i className="bi bi-arrow-down-circle text-[#7890A8]" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <i className={`bi ${item.type === 'dir' ? 'bi-folder' : 'bi-file-earmark'} shrink-0 text-[12px] text-[#7890A8]`} />
                    <span className="truncate text-[12px] font-normal text-[#475569]" title={item.name}>
                        {item.name}
                    </span>
                </div>
                {!isDone && !isError && (
                    <div className="mt-2">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-[#F1F3F6]">
                            <div
                                className="h-full rounded-full bg-[#7890A8] transition-all duration-200"
                                style={{ width: `${Math.max(0, Math.min(100, overallProgress))}%` }}
                            />
                        </div>
                        <div className="mt-1 text-[10px] font-normal text-[#94A3B8]">
                            {isPending ? 'В очереди…' : (
                                <>
                                    {totalParts > 1 && <>Часть {currentPart} из {totalParts} · </>}
                                    {item.progress !== null && item.progress !== undefined
                                        ? `${overallProgress}%`
                                        : item.loadedMB ? `Загружено ${item.loadedMB} МБ` : 'Загрузка…'}
                                </>
                            )}
                        </div>
                    </div>
                )}
                {isDone && <div className="mt-1 text-[10px] text-[#7890A8]">Готово</div>}
                {isError && <div className="mt-1 truncate text-[10px] text-[#C46C6C]">{item.error || 'Ошибка'}</div>}
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#F3F5F7] hover:text-[#475569]"
                title="Убрать из списка"
                aria-label={`Убрать ${item.name} из списка`}
            >
                <i className="bi bi-x text-[15px]" />
            </button>
        </div>
    );
};
