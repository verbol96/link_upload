import { useEffect, useRef } from "react";

const ListPhoto = ({ photos, activePhoto, changePhoto }) => {
    const itemRefs = useRef({});

    useEffect(() => {
        const activeId = photos[activePhoto]?.id;
        if (activeId && itemRefs.current[activeId]) {
            itemRefs.current[activeId].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [activePhoto, photos]);

    // Форматирование размера файла
    const formatSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' Б';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
        return (bytes / 1024 / 1024).toFixed(1) + ' МБ';
    };

    if (photos.length < 1) {
        return (
            <div className="h-full bg-slate-50 p-4 overflow-auto">
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="flex justify-center w-full">
                            <div className="h-24 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            {/* === МОБИЛЬНЫЙ СПИСОК === */}
            <div className="md:hidden h-full bg-white overflow-auto">
                <div className="divide-y divide-gray-100">
                    {photos.map((el, index) => (
                        <div
                            key={el.id}
                            ref={(node) => {
                                if (node) itemRefs.current[el.id] = node;
                                else delete itemRefs.current[el.id];
                            }}
                            onClick={() => changePhoto(index)}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                activePhoto === index 
                                    ? 'bg-teal-50' 
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            {/* Номер слева */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium ${
                                activePhoto === index 
                                    ? 'bg-teal-700 text-white' 
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                {index + 1}
                            </div>

                            {/* Превью */}
                            <img
                                src={el.thumb}
                                alt={el.name}
                                className="w-12 h-12 object-cover rounded-lg shrink-0"
                            />

                            {/* Имя файла */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">
                                    {el.name}
                                </div>
                                {/* Название формата или что-то ещё */}
                                {el.size && (
                                    <div className="text-xs text-gray-400">
                                        {formatSize(el.size)}
                                    </div>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            </div>

            {/* === ДЕСКТОПНЫЙ СПИСОК (как было) === */}
            <div className="hidden md:block h-full bg-gray-100 p-4 overflow-auto border-r">
                <div className="space-y-3">
                    {photos.map((el, index) => (
                        <div
                            key={el.id}
                            
                            ref={(node) => {
                                if (node) itemRefs.current[el.id] = node;
                                else delete itemRefs.current[el.id];
                            }}
                            className={`group relative flex justify-center w-full cursor-pointer transition-all duration-200 ${
                                activePhoto === index ? 'scale-105' : 'hover:scale-102'
                            }`}
                            onClick={() => changePhoto(index)}
                        >
                            <div className={`absolute inset-0 rounded-lg transition-all duration-200 ${
                                activePhoto === index 
                                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50' 
                                    : 'group-hover:ring-1 group-hover:ring-gray-300'
                            }`} />
                            
                            <img
                                src={el.thumb}
                                alt={el.name}
                                className={`h-24 w-24 object-cover rounded-lg shadow-md transition-all duration-200 ${
                                    activePhoto === index 
                                        ? 'brightness-100' 
                                        : 'brightness-90 group-hover:brightness-100'
                                }`}
                            />
                            
                            <div className="absolute bottom-1 left-1 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
                                <span className="text-white text-xs font-medium">{index + 1}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default ListPhoto;