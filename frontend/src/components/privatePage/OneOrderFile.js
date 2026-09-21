import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { displayFileImg, getFilesPhotosId } from "../../http/cloudApi";

export const OneOrderFile = ({ el, status, PriceList, settings }) => {
    const [thumb, setThumb] = useState([]);
    const [imgDownload, setImgDownload] = useState(0);
    const [isShow, setIsShow] = useState(false);
    const [showAllModal, setShowAllModal] = useState(false);

    const useIsDesktop = () => {
        const [isDesktop, setIsDesktop] = useState(
            typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
        );

        useEffect(() => {
            const mq = window.matchMedia('(min-width: 768px)');
            const handler = (e) => setIsDesktop(e.matches);
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }, []);

        return isDesktop;
    };

    const isDesktop = useIsDesktop();
    const MAX_VISIBLE = isDesktop ? 8 : 3;

    useEffect(() => {
        const getFiles = async (id) => {
            try {
                const data = await getFilesPhotosId(id);
                const thumbs = await Promise.all(
                    data.map(item => displayFileImg(item.id))
                );
                setThumb(thumbs.filter(Boolean));

                const ImgDownload = data.reduce((acc, current) => {
                    return current.size > 0 ? acc + 1 : acc;
                }, 0);

                setImgDownload(ImgDownload);
                setIsShow(true);
            } catch (error) {
                console.error(error);
            }
        };
        getFiles(el.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatName = settings.find(s => s.title === el.format)?.name || 'не найдено';
    const summa = (PriceList(el.format) * el.amount * el.copies).toFixed(2);
    const isPhotosLoaded = imgDownload === el.amount;

    const ShowType = (type) => {
        switch (type) {
            case 'holst': return 'Холст';
            case 'photo': return 'Фото';
            case 'magnit': return 'Магнит';
            case 'poster': return 'Постер';
            default: return 'Неизвестно';
        }
    };

    const visibleThumbs = thumb.slice(0, MAX_VISIBLE);
    const hiddenCount = thumb.length - MAX_VISIBLE;

    // ← МОДАЛКА ЧЕРЕЗ PORTAL
    const ModalContent = showAllModal ? ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowAllModal(false)}
        >
            <div
                className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Заголовок */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="min-w-0 flex-1">
                        <div className="text-sm md:text-base font-semibold text-gray-800">
                            Все фото ({thumb.length})
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {ShowType(el.type)} · {formatName}
                            {el.type === 'photo' && ` · ${el.paper === 'glossy' ? 'Глянец' : 'Люстр'}`}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAllModal(false)}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 
                                   flex items-center justify-center text-gray-500 
                                   text-2xl shrink-0 ml-2"
                    >
                        ×
                    </button>
                </div>

                {/* Сетка фото */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {thumb.map((src, index) => (
                            <div
                                key={index}
                                className="relative w-full aspect-square 
                                           rounded-lg overflow-hidden 
                                           border border-gray-200 bg-white shadow-sm"
                            >
                                <img
                                    src={src}
                                    alt={`Фото ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-1 left-1 
                                                bg-black/60 backdrop-blur-sm 
                                                rounded px-1.5 py-0.5 
                                                text-white text-[10px] font-medium">
                                    {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 space-y-3 border-2 border-gray-100">

                {/* Шапка */}
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                    <span className="px-2 py-1 rounded-md bg-blue-100 text-black font-medium whitespace-nowrap">
                        {ShowType(el.type)}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-blue-100 text-black font-medium whitespace-nowrap">
                        {formatName}
                    </span>
                    {el.type === 'photo' && (
                        <span className="px-2 py-1 rounded-md bg-blue-100 text-black font-medium whitespace-nowrap">
                            {el.paper === 'glossy' ? 'Глянец' : 'Люстр'}
                        </span>
                    )}
                    <div className="basis-full h-0"></div>
                    <span className="px-2 py-1 rounded-md bg-gray-200 text-gray-700 font-medium whitespace-nowrap">
                        {el.amount} шт
                    </span>
                    <span className="px-2 py-1 rounded-md bg-gray-200 text-gray-700 font-medium whitespace-nowrap">
                        Копий: по {el.copies}шт
                    </span>
                    <span className="ml-auto text-sm md:text-base font-bold text-teal-900 whitespace-nowrap">
                        = {summa} р
                    </span>
                </div>

                {/* Статус */}
                {status === 0 && (
                    <div>
                        {!isShow ? (
                            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
                                <i className="bi bi-arrow-repeat animate-spin text-teal-700"></i>
                                Проверка фото...
                            </div>
                        ) : isPhotosLoaded ? (
                            <div className="flex items-center gap-2 text-xs md:text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                                <i className="bi bi-check-circle-fill"></i>
                                <span className="font-medium">
                                    Загружено {el.amount} из {el.amount} фото
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs md:text-sm text-red-700 bg-red-50 px-3 py-1.5 rounded-lg">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                <span className="font-medium">
                                    Пришло {imgDownload} из {el.amount} фото
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Превью — один ряд */}
                {thumb.length > 0 && (
                    <div className="flex gap-2 overflow-hidden">

                        {visibleThumbs.map((src, index) => (
                            <div
                                key={index}
                                className="relative shrink-0 w-16 h-16 md:w-20 md:h-20 
                                           rounded-lg overflow-hidden border border-gray-200 
                                           bg-white shadow-sm"
                            >
                                <img
                                    src={src}
                                    alt={`Фото ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0.5 left-0.5 
                                                bg-black/60 backdrop-blur-sm 
                                                rounded px-1 text-white text-[10px] font-medium">
                                    {index + 1}
                                </div>
                            </div>
                        ))}

                        {hiddenCount > 0 && (
                            <div
                                onClick={() => setShowAllModal(true)}
                                className="shrink-0 w-16 h-16 md:w-20 md:h-20 
                                        aspect-square
                                        rounded-lg
                                        bg-gray-900/80 hover:bg-teal-900 
                                        flex flex-col items-center justify-center 
                                        text-white  shadow-md"
                            >
                                <i className="bi bi-images text-white text-lg"></i>
                                <span className="text-xs font-bold mt-0.5">
                                    +{hiddenCount}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Модалка через Portal */}
            {ModalContent}
        </>
    );
};