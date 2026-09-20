import { useDispatch, useSelector } from 'react-redux';
import { removeDownload, clearFinished } from '../../store/downloadsReducer';

export const DownloadPanel = () => {
    const dispatch = useDispatch();
    const items = useSelector(state => state.downloads.items);

    // Ничего не показываем, если нет активных или недавно завершённых
    if (items.length === 0) return null;

    const doneCount = items.filter(i => i.status === 'done').length;
    const totalCount = items.length;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] w-80 max-w-[calc(100vw-2rem)]">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">

                {/* Шапка */}
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

                {/* Список загрузок */}
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

    return (
        <div className="px-4 py-2.5 flex items-start gap-2.5">
            {/* Иконка статуса */}
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

            {/* Контент */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <i className={`bi ${item.type === 'dir' ? 'bi-folder-fill text-teal-700' : 'bi-file-earmark text-gray-500'} text-xs shrink-0`}></i>
                    <div className="text-xs text-gray-800 truncate" title={item.name}>
                        {item.name}
                    </div>
                </div>

                {/* Прогресс-бар */}
                {!isDone && !isError && (
                    <div className="mt-1.5">
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-1 bg-teal-700 rounded-full transition-all duration-200"
                                style={{ width: `${item.progress}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                            {isPending ? 'В очереди...' : `${item.progress}%`}
                        </div>
                    </div>
                )}

                {isError && (
                    <div className="text-[10px] text-red-500 mt-0.5 truncate">
                        {item.error || 'Ошибка'}
                    </div>
                )}
            </div>

            {/* Кнопка закрыть */}
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