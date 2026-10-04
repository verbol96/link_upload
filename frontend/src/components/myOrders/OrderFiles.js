import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import { displayFileImg, getFilesPhotosId } from "../../http/cloudApi";

const getTypeName=(type)=>{
    switch(type){
        case'holst': return'Холст';
        case'photo': return'Фото';
        case'magnit': return'Магнит';
        case'poster': return'Постер';
        default: return'Неизвестно';
    }
};

export const OrderFiles=({item,status,settings,priceList})=>{
    const[thumbs,setThumbs]=useState([]);
    const[loadedCount,setLoadedCount]=useState(0);
    const[loading,setLoading]=useState(true);
    const[showAll,setShowAll]=useState(false);
    const[isDesktop,setIsDesktop]=useState(()=>typeof window!=="undefined"&&window.matchMedia("(min-width: 768px)").matches);

    useEffect(()=>{
        const media=window.matchMedia("(min-width: 768px)");
        const handleChange=(event)=>setIsDesktop(event.matches);

        media.addEventListener("change",handleChange);

        return()=>media.removeEventListener("change",handleChange);
    },[]);

    useEffect(()=>{
        const loadFiles=async()=>{
            try{
                const files=await getFilesPhotosId(item.id);
                const images=await Promise.all(files.map(file=>displayFileImg(file.id)));

                setThumbs(images.filter(Boolean));
                setLoadedCount(files.filter(file=>file.size>0).length);
            }catch(error){
                console.error("Ошибка загрузки файлов заказа:",error);
            }finally{
                setLoading(false);
            }
        };

        loadFiles();
    },[item.id]);

    const maxVisible=isDesktop?8:3;
    const visibleThumbs=thumbs.slice(0,maxVisible);
    const hiddenCount=Math.max(0,thumbs.length-maxVisible);
    const formatName=settings.find(el=>el.title===item.format)?.name||item.format||"Не найдено";
    const sum=(priceList(item.format)*Number(item.amount||0)*Number(item.copies||0)).toFixed(2);
    const allLoaded=loadedCount===Number(item.amount);

    return (
        <>
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 space-y-3 border border-gray-100">
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm font-light">
                    <span className="px-2 py-1 rounded-md bg-blue-100 text-gray-800  whitespace-nowrap">
                        {getTypeName(item.type)}
                    </span>

                    <span className="px-2 py-1 rounded-md bg-blue-100 text-gray-800  whitespace-nowrap">
                        {formatName}
                    </span>

                    {item.type==="photo"&&(
                        <span className="px-2 py-1 rounded-md bg-blue-100 text-gray-800  whitespace-nowrap">
                            {item.paper==="glossy"?"Глянец":"Люстр"}
                        </span>
                    )}

                    <span className="px-2 py-1 rounded-md bg-gray-200 text-gray-700 whitespace-nowrap">
                        {item.amount} шт
                    </span>

                    {(item.type==="photo"||item.type==="magnit")&&Number(item.copies)>1&&(
                        <span className="px-2 py-1 rounded-md bg-gray-200 text-gray-700 whitespace-nowrap">
                            по {item.copies} копии
                        </span>
                    )}

                    <span className="ml-auto text-sm md:text-base font-semibold text-stone-900 whitespace-nowrap">
                        {sum} р
                    </span>
                </div>

                {(status===0 || status===8)&&(
                    <div>
                        {loading?(
                            <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-400">
                                <i className="bi bi-arrow-repeat animate-spin text-[12px] text-slate-400"/>
                                <span>
                                    Проверяем загрузку фотографий...
                                </span>
                            </div>
                        ):allLoaded?(
                            <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-green-700">
                                <i className="bi bi-check-circle-fill text-[12px]"/>
                                <span className="font-medium">
                                    Все фото загружены
                                </span>
                            </div>
                        ):(
                            <div className="inline-flex items-center gap-2 text-[11px] md:text-xs text-red-700 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg">
                                <i className="bi bi-exclamation-triangle-fill text-[12px] shrink-0"/>
                                <span className="font-medium">
                                    Загружено {loadedCount} из {item.amount} фото
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {thumbs.length>0&&(
                    <div className="flex gap-2 overflow-hidden">
                        {visibleThumbs.map((src,index)=>(
                            <div key={index} className="relative shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                                <img src={src} alt={`Фото ${index+1}`} className="w-full h-full object-cover"/>
                                <div className="absolute bottom-0.5 left-0.5 bg-black/60 rounded px-1 text-white text-[10px] font-medium">
                                    {index+1}
                                </div>
                            </div>
                        ))}

                        {hiddenCount>0&&(
                            <button
                                type="button"
                                onClick={()=>setShowAll(true)}
                                className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-800 hover:bg-teal-900 flex flex-col items-center justify-center text-white shadow-md transition-colors"
                            >
                                <i className="bi bi-images text-lg"/>
                                <span className="text-xs font-bold mt-0.5">
                                    +{hiddenCount}
                                </span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showAll&&ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4" onClick={()=>setShowAll(false)}>
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={event=>event.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="min-w-0 flex-1">
                                <div className="text-sm md:text-base font-semibold text-gray-800">
                                    Все фото ({thumbs.length})
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 truncate">
                                    {getTypeName(item.type)} · {formatName}
                                    {item.type==="photo"&&` · ${item.paper==="glossy"?"Глянец":"Люстр"}`}
                                </div>
                                <div className="text-sm md:text-xs font-thin text-gray-800 mt-1">
                                    (иконки загруженных фото)
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={()=>setShowAll(false)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl shrink-0 ml-2"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-4">
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                {thumbs.map((src,index)=>(
                                    <div key={index} className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                                        <img src={src} alt={`Фото ${index+1}`} className="w-full h-full object-cover"/>
                                        <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1.5 py-0.5 text-white text-[10px] font-medium">
                                            {index+1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};