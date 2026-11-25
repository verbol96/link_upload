import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { displayFileImg, displayFileLarge, getFilesPhotosId } from '../../http/cloudApi';

const formatFileSize = bytes => {
    const size = Number(bytes);
    if (!Number.isFinite(size) || size < 0) return 'Размер неизвестен';
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2).replace('.', ',')} МБ`;
    return `${Math.round(size / 1024)} КБ`;
};

const getTypeName = type => {
    switch (type) {
        case 'holst': return 'Холст';
        case 'photo': return 'Фото';
        case 'magnit': return 'Магнит';
        case 'poster': return 'Постер';
        default: return 'Неизвестно';
    }
};

export const OrderFiles = ({ item, status, settings, priceList }) => {
    const [files, setFiles] = useState([]);
    const [thumbs, setThumbs] = useState({});
    const thumbUrlsRef = useRef(new Map());
    const requestedRef = useRef(new Set());
    const generationRef = useRef(0);
    const [loadedCount, setLoadedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(null);
    const [previewIndex, setPreviewIndex] = useState(null);
    const [largeSrc, setLargeSrc] = useState(null);
    const [largeLoading, setLargeLoading] = useState(false);
    const [largeError, setLargeError] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);

    useEffect(() => {
        const media = window.matchMedia('(min-width: 768px)');
        const handleChange = event => setIsDesktop(event.matches);
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        let active = true;
        const generation = ++generationRef.current;
        // Освобождаем миниатюры предыдущего заказа.
        for (const url of thumbUrlsRef.current.values()) URL.revokeObjectURL(url);
        thumbUrlsRef.current.clear();
        requestedRef.current.clear();
        setFiles([]);
        setThumbs({});
        setLoadedCount(0);
        setPreviewIndex(null);
        setVisibleCount(null);
        setLoading(Number(status) !== 6);

        if (Number(status) !== 6) {
            getFilesPhotosId(item.id)
                .then(result => {
                    if (!active || generation !== generationRef.current) return;
                    const list = Array.isArray(result) ? result.filter(f => f.type !== 'dir') : [];
                    setFiles(list);
                    setLoadedCount(list.filter(f => Number(f.size) > 0).length);
                })
                .catch(error => console.error('Ошибка получения списка файлов:', error))
                .finally(() => { if (active) setLoading(false); });
        }
        return () => { active = false; };
    }, [item.id, status]);

    const initialCount = isDesktop ? 8 : 3;
    const shownCount = visibleCount === null ? initialCount : visibleCount;

    useEffect(() => {
        if (Number(status) === 6 || !files.length) return;
        const generation = generationRef.current;
        const pending = files.slice(0, shownCount).filter(file =>
            !requestedRef.current.has(file.id) && !thumbUrlsRef.current.has(file.id)
        );
        pending.forEach(file => requestedRef.current.add(file.id));
        let cursor = 0;
        // Не больше четырёх параллельных запросов к Sharp.
        const worker = async () => {
            while (cursor < pending.length && generation === generationRef.current) {
                const file = pending[cursor++];
                try {
                    const url = await displayFileImg(file.id);
                    if (!url) continue;
                    if (generation !== generationRef.current) {
                        URL.revokeObjectURL(url);
                        return;
                    }
                    thumbUrlsRef.current.set(file.id, url);
                    setThumbs(prev => ({ ...prev, [file.id]: url }));
                } catch (error) {
                    console.error('Ошибка миниатюры:', file.id, error);
                }
            }
        };
        Promise.all(Array.from({ length: Math.min(4, pending.length) }, worker));
    }, [files, shownCount, status]);

    useEffect(() => () => {
        ++generationRef.current;
        for (const url of thumbUrlsRef.current.values()) URL.revokeObjectURL(url);
        thumbUrlsRef.current.clear();
    }, []);

    useEffect(() => {
        if (previewIndex === null || !files[previewIndex] || Number(status) === 6) {
            setLargeSrc(null);
            setLargeLoading(false);
            setLargeError(false);
            return;
        }

        let active = true;
        let objectUrl = null;
        setLargeSrc(null);
        setLargeError(false);
        setLargeLoading(true);

        displayFileLarge(files[previewIndex].id)
            .then(url => {
                if (!url) throw new Error('Пустое изображение');
                if (active) {
                    objectUrl = url;
                    setLargeSrc({ id: files[previewIndex].id, url });
                } else {
                    URL.revokeObjectURL(url);
                }
            })
            .catch(error => {
                if (active) {
                    console.error('Ошибка загрузки крупного фото:', error);
                    setLargeError(true);
                }
            })
            .finally(() => {
                if (active) setLargeLoading(false);
            });

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [previewIndex, files, status]);

    useEffect(() => {
        if (previewIndex === null) return;
        const onKey = event => {
            if (event.key === 'Escape') setPreviewIndex(null);
            if (event.key === 'ArrowRight') setPreviewIndex(i => (i + 1) % files.length);
            if (event.key === 'ArrowLeft') setPreviewIndex(i => (i - 1 + files.length) % files.length);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [previewIndex, files.length]);

    const visibleThumbs = files.slice(0, shownCount);
    const hiddenCount = Math.max(0, files.length - shownCount);
    const formatName = settings.find(el => el.title === item.format)?.name || item.format || 'Не найдено';
    const sum = (priceList(item.format) * Number(item.amount || 0) * Number(item.copies || 0)).toFixed(2);
    const allLoaded = loadedCount === Number(item.amount);

    return (
        <>
            <div className="bg-white rounded-lg p-3 md:p-4 space-y-3 border border-slate-200">
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm font-light">
                    <span className="px-2 py-1 rounded-md bg-slate-200 text-slate-700 whitespace-nowrap">{getTypeName(item.type)}</span>
                    <span className="px-2 py-1 rounded-md bg-slate-200 text-slate-700 whitespace-nowrap">{formatName}</span>
                    {item.type === 'photo' && (
                        <span className="px-2 py-1 rounded-md bg-slate-200 text-slate-700 whitespace-nowrap">
                            {item.paper === 'glossy' ? 'Глянец' : 'Люстр'}
                        </span>
                    )}
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 whitespace-nowrap">{item.amount} шт</span>
                    {(item.type === 'photo' || item.type === 'magnit') && Number(item.copies) > 1 && (
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 whitespace-nowrap">по {item.copies} копии</span>
                    )}
                    <span className="ml-auto text-sm md:text-base font-semibold text-slate-900 whitespace-nowrap">{sum} р</span>
                </div>

                {(status === 0 || status === 8) && (
                    <div>
                        {loading ? (
                            <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-400">
                                <i className="bi bi-arrow-repeat animate-spin text-[12px] text-slate-400" />
                                <span>Проверяем загрузку фотографий...</span>
                            </div>
                        ) : allLoaded ? (
                            <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-green-700">
                                <i className="bi bi-check-circle-fill text-[12px]" />
                                <span className="font-medium">Все фото загружены</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 text-[11px] md:text-xs text-red-700 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg">
                                <i className="bi bi-exclamation-triangle-fill text-[12px] shrink-0" />
                                <span className="font-medium">Загружено {loadedCount} из {item.amount} фото</span>
                            </div>
                        )}
                    </div>
                )}

                {Number(status) === 6 ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                        <i className="bi bi-folder-x text-base" />
                        Файлы удалены с сервера
                    </div>
                ) : files.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {visibleThumbs.map((photo, index) => (
                                <button type="button" key={photo.id} onClick={() => setPreviewIndex(index)} title={photo.name || 'Открыть фото'} className="relative shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                                    {thumbs[photo.id] ? (
                                        <img src={thumbs[photo.id]} alt={`Фото ${index + 1}`} loading="lazy" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-slate-400"><i className="bi bi-arrow-repeat animate-spin" /></span>
                                    )}
                                    <div className="absolute bottom-0.5 left-0.5 bg-black/60 rounded px-1 text-white text-[10px] font-medium">{index + 1}</div>
                                </button>
                            ))}
                            {hiddenCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setVisibleCount(count => Math.min(files.length, (count === null ? initialCount : count) + 50))}
                                    title={`Показать ещё ${Math.min(50, hiddenCount)} фото`}
                                    className="flex shrink-0 w-16 h-16 md:w-20 md:h-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-100 text-slate-600 hover:border-slate-400 hover:bg-slate-200 transition-colors"
                                >
                                    <i className="bi bi-plus-lg text-lg md:text-xl" />
                                    <span className="text-[10px] md:text-xs font-medium">Ещё {Math.min(50, hiddenCount)}</span>
                                </button>
                            )}
                        </div>
                        {shownCount > initialCount && (
                            <button
                                type="button"
                                onClick={() => setVisibleCount(null)}
                                className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                <i className="bi bi-chevron-up" />
                                Свернуть
                            </button>
                        )}
                    </div>
                )}
            </div>

            {Number(status) !== 6 && previewIndex !== null && files[previewIndex] && ReactDOM.createPortal(
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-[10000] flex flex-col bg-black/95 text-white" onClick={() => setPreviewIndex(null)}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0 flex-1 pr-3">
                            <div className="truncate text-sm font-medium" title={files[previewIndex].name}>
                                {files[previewIndex].name || `Фото ${previewIndex + 1}`}
                            </div>
                            <div className="text-xs text-white/60">
                                {formatFileSize(files[previewIndex].size)} · {previewIndex + 1} из {files.length}
                            </div>
                        </div>
                        <button type="button" onClick={() => setPreviewIndex(null)} aria-label="Закрыть" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><i className="bi bi-x-lg" /></button>
                    </div>
                    <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
                        {(largeSrc?.id === files[previewIndex].id || thumbs[files[previewIndex].id]) && <img
                            src={largeSrc?.id === files[previewIndex].id ? largeSrc.url : thumbs[files[previewIndex].id]}
                            alt={files[previewIndex].name || `Фото ${previewIndex + 1}`}
                            onClick={event => event.stopPropagation()}
                            className="max-h-full max-w-full object-contain"
                        />}
                        {largeLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/35 pointer-events-none">
                                <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white shadow-lg">
                                    <i className="bi bi-arrow-repeat animate-spin" />
                                    Загружаем качественное фото…
                                </div>
                            </div>
                        )}
                        {largeError && (
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-lg bg-black/80 px-3 py-2 text-center text-xs text-white/90 pointer-events-none">
                                Не удалось загрузить крупную версию. Показана миниатюра.
                            </div>
                        )}
                        {files.length > 1 && (
                            <>
                                <button type="button" aria-label="Предыдущее фото" onClick={e => { e.stopPropagation(); setPreviewIndex(i => (i - 1 + files.length) % files.length); }} className="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50"><i className="bi bi-chevron-left" /></button>
                                <button type="button" aria-label="Следующее фото" onClick={e => { e.stopPropagation(); setPreviewIndex(i => (i + 1) % files.length); }} className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50"><i className="bi bi-chevron-right" /></button>
                            </>
                        )}
                    </div>
                </div>, document.body
            )}
        </>
    );
};
