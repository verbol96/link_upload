import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    removeDownload,
    clearFinished,
    setProgress,
    setDone,
    setError,
} from '../../store/downloadsReducer';
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
                        dispatch(setProgress({
                            id: pending.id,
                            progress: percent,
                            part,
                            totalParts,
                            loadedMB,
                        }));
                    },
                    (part, totalParts) => {
                        dispatch(setDone({
                            id: pending.id,
                            part,
                            totalParts,
                        }));
                    }
                );
            } catch (err) {
                dispatch(setError({
                    id: pending.id,
                    error: err.message || 'Ошибка скачивания',
                }));
            } finally {
                processingRef.current = false;

                // Проверяем, есть ли ещё pending — и запускаем снова
                setTimeout(() => {
                    const hasPending = itemsRef.current.some(i => i.status === 'pending');
                    if (hasPending) {
                        processQueue();
                    }
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
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-teal-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <i className="bi bi-cloud-arrow-down"></i>
                        Загрузки {doneCount > 0 && `(${doneCount}/${totalCount})`}
                    </div>
                    {doneCount > 0 && (
                        <button
                            onClick={() => dispatch(clearFinished())}
                            className="text-xs text-white/70 hover:text-white transition-colors"
                            title="Скрыть завершённые"
                        >
                            Очистить
                        </button>
                    )}
                </div>

                <div className="max-h-64 overflow-auto divide-y divide-gray-100">
                    {items.map(item => (
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
            ? Math.round(
                ((currentPart - 1) / totalParts) * 100 +
                (currentProgress / totalParts)
            )
            : currentProgress;

    return (
        <div className="px-4 py-2.5 flex items-start gap-2.5">
            <div className="shrink-0 mt-0.5">
                {isDone ? (
                    <i className="bi bi-check-circle-fill text-green-600"></i>
                ) : isError ? (
                    <i className="bi bi-exclamation-triangle-fill text-red-500"></i>
                ) : isPending ? (
                    <i className="bi bi-hourglass-split text-gray-400"></i>
                ) : (
                    <i className="bi bi-cloud-arrow-down text-teal-700"></i>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <i className={`bi ${item.type === 'dir' ? 'bi-folder-fill text-teal-700' : 'bi-file-earmark text-gray-500'} text-xs shrink-0`}></i>
                    <div className="text-xs text-gray-800 truncate" title={item.name}>
                        {item.name}
                    </div>
                </div>

                {!isDone && !isError && (
                    <div className="mt-1.5">
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-1 bg-teal-700 rounded-full transition-all duration-200"
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                            {isPending ? (
                                'В очереди...'
                            ) : (
                                <>
                                    {totalParts > 1 && <>Часть {currentPart} из {totalParts} · </>}
                                    {item.progress !== null && item.progress !== undefined
                                        ? `${overallProgress}%`
                                        : item.loadedMB
                                            ? `Загружено ${item.loadedMB} МБ`
                                            : 'Загрузка...'}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {isDone && (
                    <div className="text-[10px] text-green-600 mt-0.5">
                        Готово
                    </div>
                )}

                {isError && (
                    <div className="text-[10px] text-red-500 mt-0.5 truncate">
                        {item.error || 'Ошибка'}
                    </div>
                )}
            </div>

            <button
                onClick={onRemove}
                className="shrink-0 w-5 h-5 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                title="Убрать из списка"
            >
                <i className="bi bi-x text-xs"></i>
            </button>
        </div>
    );
};