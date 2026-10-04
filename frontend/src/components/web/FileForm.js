import { useRef, useEffect, useState } from "react";
import { ImgCard } from "./ImgCard";
import { useDispatch, useSelector } from 'react-redux';
import { saveSettings } from "../../store/orderReducer";
import { v4 as uuidv4 } from 'uuid';
import loadImage from 'blueimp-load-image';
import heic2any from "heic2any";
import { getSettings } from "../../http/dbApi";
import { setLogUser } from "../../http/authApi";

// ============ ХУК: определяем мобилку ============
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isMobile;
};

export const FileForm = ({ item, filesPrev, setFilesPrev, setFormats, formats, notLoad, setNotLoad, onDeleteFormat }) => {
    const [showAllPhotos, setShowAllPhotos] = useState(false)
    const fileInput = useRef(null);
    const dispach = useDispatch();
    const settings = useSelector(state => state.order.settings);
    const isMobile = useIsMobile();
    const TypePhoto = ['photo', 'holst', 'magnit', 'poster'];

    const FormatPhoto = settings
        .filter(el => el.type === 'photo')
        .sort((a, b) => b.title.localeCompare(a.title));

    const FormatHolst = settings.filter(el => el.type === 'holst');
    const FormatMagnit = settings.filter(el => el.type === 'magnit');
    const FormatPoster = settings.filter(el => el.type === 'poster');

    useEffect(() => {
        async function getPriceList() {
            let value = await getSettings();
            dispach(saveSettings(value));
        }
        getPriceList();
    }, [dispach]);

    const sizePhoto = () => {
        switch (formats[item].type) {
            case 'photo': return FormatPhoto;
            case 'holst': return FormatHolst;
            case 'magnit': return FormatMagnit;
            case 'poster': return FormatPoster;
            default: return FormatPhoto;
        }
    };

    const ChangeType = (e) => {
        let formatValue;
        if (e.target.value === 'photo') formatValue = FormatPhoto[0].title;
        if (e.target.value === 'holst') formatValue = FormatHolst[0].title;
        if (e.target.value === 'magnit') formatValue = FormatMagnit[0].title;
        if (e.target.value === 'poster') formatValue = FormatPoster[0].title;

        const copies = e.target.value === 'photo' || e.target.value === 'magnit'
            ? formats[item].copies || 1
            : 1;

        setFormats([...formats.slice(0, item), { ...formats[item], type: e.target.value, format: formatValue, copies }, ...formats.slice(item + 1)]);
    };

    const ChangeSize = (e) => {
        setFormats([...formats.slice(0, item), { ...formats[item], format: e.target.value }, ...formats.slice(item + 1)]);
    };

    const ChangePaper = (e) => {
        setFormats([...formats.slice(0, item), { ...formats[item], paper: e.target.value }, ...formats.slice(item + 1)]);
    };

    const ChangeCopies = (value) => {
        const copies = Math.max(1, Number(formats[item].copies || 1) + value);
        setFormats([...formats.slice(0, item), { ...formats[item], copies }, ...formats.slice(item + 1)]);
    };

    const [load, setLoad] = useState({
        isLoad: false,
        count: 0
    });

    const UploadFiles=async(e)=>{
        const files=Array.from(e.target.files);

        const getBrowserName=()=>{
            const agent=window.navigator.userAgent.toLowerCase();
            if(agent.indexOf('chrome')>-1&&agent.indexOf('safari')>-1){
                return 'chrome';
            }else if(agent.indexOf('safari')>-1){
                return 'safari';
            }else{
                return 'unknown';
            }
        };

        const createObj=async(file)=>{
            try{
                const type=file.name.split('.').pop().toLowerCase();

                if(file.size===0)return 0;

                if(type==='heic'){
                    if(getBrowserName()==='safari'){
                        const asyncOperationWithPromise=async()=>{
                            return new Promise((resolve,reject)=>{
                                loadImage(
                                    file,
                                    (canvas)=>{
                                        canvas.toBlob(
                                            (blob)=>{
                                                resolve({
                                                    id:uuidv4(),
                                                    name:file.name,
                                                    file:blob
                                                });
                                            },
                                            'image/jpeg'
                                        );
                                    },
                                    {canvas:true}
                                );
                            });
                        };

                        return asyncOperationWithPromise().then((result)=>{
                            const name=result.name.split('.')[0];
                            let file=new File([result.file],name+'.jpeg',{type:'image/jpeg'});
                            const obj={id:uuidv4(),file:file};
                            return obj;
                        });
                    }else{
                        const result=await heic2any({
                            blob:file,
                            toType:'image/jpeg'
                        });

                        const newfile=new File([result],file.name.split('.')[0]+'.jpeg',{type:'image/jpeg'});
                        const obj={id:uuidv4(),file:newfile};
                        return obj;
                    }
                }

                if(type==='webp'||type==='bmp'){
                    const asyncOperationWithPromise=async()=>{
                        return new Promise((resolve,reject)=>{
                            loadImage(
                                file,
                                (canvas)=>{
                                    canvas.toBlob(
                                        (blob)=>{
                                            resolve({
                                                id:uuidv4(),
                                                name:file.name,
                                                file:blob
                                            });
                                        },
                                        'image/jpeg'
                                    );
                                },
                                {canvas:true}
                            );
                        });
                    };

                    return asyncOperationWithPromise().then((result)=>{
                        const name=result.name.split('.')[0];
                        let file=new File([result.file],name+'.jpeg',{type:'image/jpeg'});
                        const obj={id:uuidv4(),file:file};
                        return obj;
                    });
                }

                if(type==='jpeg'||type==='jpg'||type==='png'){
                    const obj={id:uuidv4(),file:file};
                    return obj;
                }

                return 0;
            }catch(error){
                console.log(error);
                return 0;
            }
        };

        const scaleImg=async(el)=>{
            return new Promise((resolve,reject)=>{
                const img=new Image();
                img.src=URL.createObjectURL(el.file);

                img.onload=function(){
                    const canvas=document.createElement('canvas');
                    const ctx=canvas.getContext('2d');
                    const scale=img.width/img.height;

                    canvas.width=400*scale;
                    canvas.height=400;

                    ctx.drawImage(img,0,0,canvas.width,canvas.height);

                    canvas.toBlob(blob=>{
                        const newFile=new File([blob],el.file.name,{type:el.file.type});
                        const obj={
                            url:URL.createObjectURL(newFile),
                            id:el.id
                        };

                        resolve(obj);
                    });
                };
            });
        };

        const downloadImg=async()=>{
            setLoad({isLoad:true,count:files.length});

            let addedCount=0;

            for(const file of files){
                const original=await createObj(file);

                if(original===0){
                    setNotLoad(prevFilesPrevArray=>{
                        let newFilesPrevArray=[...prevFilesPrevArray];
                        newFilesPrevArray[item]=[...newFilesPrevArray[item],file.name];
                        return newFilesPrevArray;
                    });
                    continue;
                }

                setFormats(prev=>{
                    let newArr=[...prev];
                    newArr[item]={
                        ...newArr[item],
                        files:[...newArr[item].files,original]
                    };
                    return newArr;
                });

                const preview=await scaleImg(original);

                setFilesPrev(prevFilesPrevArray=>{
                    let newFilesPrevArray=[...prevFilesPrevArray];
                    newFilesPrevArray[item]=[...newFilesPrevArray[item],preview];
                    return newFilesPrevArray;
                });

                addedCount++;
            }

            if(addedCount>0){
                setLogUser({
                    event:'photos_added',
                    eventType:'info',
                    photosCount:addedCount,
                    format:formats[item]?.format||null
                });
            }

            setLoad({isLoad:false,count:0});
        };

        downloadImg();
    };

    const deleteImg = (id) => {
        setFormats([...formats.slice(0, item), { ...formats[item], files: formats[item].files.filter(el => el.id !== id) }, ...formats.slice(item + 1)]);

        setFilesPrev((prev) => {
            const newM = prev[item].filter(el => el.id !== id);
            let newPrev = [...prev];
            newPrev[item] = [...newM];
            return newPrev;
        });
    };

    const ShowType = (value) => {
        switch (value) {
            case 'photo': return 'Фотографии';
            case 'holst': return 'Холсты';
            case 'magnit': return 'Магниты';
            case 'poster': return 'Постеры';
            default: return null;
        }
    };

    const currentFormat = formats[item];

    useEffect(() => {
        setShowAllPhotos(false)
    }, [item]);

    // ===== Лимит фото: 10 на мобилке, 20 на десктопе =====
    const PHOTO_LIMIT = isMobile ? 10 : 20;
    const hiddenCount = Math.max(0, (filesPrev?.length || 0) - PHOTO_LIMIT);

    const totalForFormat = ((Number(settings.find(el => el.title === currentFormat.format)?.price) || 0)
        * currentFormat.files.length * currentFormat.copies).toFixed(2);

    const clearPhotos = () => {
        if (!currentFormat.files.length) return;
        if (!window.confirm(`Удалить все фото (${currentFormat.files.length}) из этого формата?`)) return;

        setFormats(prev => {
            const next = [...prev];
            next[item] = { ...next[item], files: [] };
            return next;
        });

        setFilesPrev(prev => {
            const next = [...prev];
            next[item] = [];
            return next;
        });

        setNotLoad(prev => {
            const next = [...prev];
            next[item] = [];
            return next;
        });

        setShowAllPhotos(false);
    };

    return (
        <div className="w-full mt-2">

            {/* ===== Строка фильтров ===== */}
            <div className="flex flex-row gap-1 md:gap-2 w-full">

                {/* Тип ===== */}
                <div className="relative w-[30%] md:w-[180px] shrink-0 md:flex-initial">
                    <select
                        className="w-full h-9 rounded-md border border-slate-200 bg-white pl-2 md:pl-3 pr-5 md:pr-8 text-[11px] md:text-[13px] font-normal text-slate-700 outline-none appearance-none focus:border-[#19766d] focus:ring-0 transition"
                        value={currentFormat.type}
                        onChange={ChangeType}
                    >
                        {TypePhoto.map(el => (
                            <option value={el} key={el}>{ShowType(el)}</option>
                        ))}
                    </select>
                    <i className="bi bi-chevron-down absolute right-1 md:right-2.5 top-1/2 -translate-y-1/2 text-[9px] md:text-[10px] text-[#53658f] pointer-events-none" />
                </div>

                {/* Размер ===== */}
                <div className="relative w-[40%] md:w-[205px] shrink-0 md:flex-initial">
                    <select
                        className="w-full h-9 rounded-md border border-slate-200 bg-white pl-2 md:pl-3 pr-5 md:pr-8 text-[11px] md:text-[13px] font-normal text-slate-700 outline-none appearance-none focus:border-[#19766d] focus:ring-0 transition"
                        value={currentFormat.format}
                        onChange={ChangeSize}
                    >
                        {sizePhoto().map(el => el.title
                            ? <option key={el.title} value={el.title}>{el.name}</option>
                            : null
                        )}
                    </select>
                    <i className="bi bi-chevron-down absolute right-1 md:right-2.5 top-1/2 -translate-y-1/2 text-[9px] md:text-[10px] text-[#53658f] pointer-events-none" />
                </div>

                {/* Бумага ===== */}
                {currentFormat.type === 'photo' && (
                    <div className="relative w-[27%] md:w-[155px] shrink-0 md:flex-initial">
                        <select
                            className="w-full h-9 rounded-md border border-slate-200 bg-white pl-2 md:pl-3 pr-5 md:pr-8 text-[11px] md:text-[13px] font-normal text-slate-700 outline-none appearance-none focus:border-[#19766d] focus:ring-0 transition"
                            value={currentFormat.paper}
                            onChange={ChangePaper}
                        >
                            <option value="glossy">Глянец</option>
                            <option value="lustre">Люстр</option>
                        </select>
                        <i className="bi bi-chevron-down absolute right-1 md:right-2.5 top-1/2 -translate-y-1/2 text-[9px] md:text-[10px] text-[#53658f] pointer-events-none" />
                    </div>
                )}

                {/* Количество экземпляров ===== */}
                {(currentFormat.type === 'photo' || currentFormat.type === 'magnit') && (
                    <div className="hidden md:flex h-9 rounded-md border border-slate-200 bg-white items-center shrink-0 px-2 text-[13px] text-slate-700">
                        <span className="mr-1">по</span>
                        <button
                            type="button"
                            onClick={() => ChangeCopies(-1)}
                            disabled={Number(currentFormat.copies || 1) <= 1}
                            className="h-full px-1.5 text-[16px] text-slate-500 hover:text-[#19766d] disabled:text-slate-300 transition-colors"
                        >
                            −
                        </button>
                        <span className="min-w-[18px] text-center font-medium tabular-nums">
                            {currentFormat.copies || 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => ChangeCopies(1)}
                            className="h-full px-1.5 text-[16px] text-slate-500 hover:text-[#19766d] transition-colors"
                        >
                            +
                        </button>
                        <span className="ml-1">шт.</span>
                    </div>
                )}

                {/* Десктоп: подсказка для произвольного размера ===== */}
                {currentFormat.format?.includes('<') && (
                    <div className="hidden md:flex items-center gap-1.5 self-center text-[11px] text-slate-400 whitespace-nowrap">
                        <i className="bi bi-info-circle text-[12px] shrink-0" />
                        <span>Размер укажите в примечании</span>
                    </div>
                )}

                {/* Десктоп: количество + сумма ===== */}
                <div className="hidden md:flex items-center gap-3 ml-auto pl-4 text-[12px] text-slate-400 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                        <i className="bi bi-images text-[13px]" />
                        {currentFormat.files.length} фото{(currentFormat.type === 'photo' || currentFormat.type === 'magnit') && Number(currentFormat.copies || 1) > 1 ? ` × ${currentFormat.copies}` : ''}
                    </span>
                    <span className="w-px h-4 bg-slate-200" />
                    <span className="font-semibold text-slate-700 tabular-nums">
                        {totalForFormat} р
                    </span>
                </div>
            </div>

            {/* ===== Мобильная подсказка ===== */}
            {currentFormat.format?.includes('<') && (
                <div className="md:hidden mt-1.5 flex items-center gap-1.5 text-[10.5px] text-slate-400">
                    <i className="bi bi-info-circle text-[11px] shrink-0" />
                    <span>Размер укажите в примечании</span>
                </div>
            )}

            {/* ===== Мобильная строка: экземпляры + количество + сумма ===== */}
            <div className="md:hidden mt-2 ml-2 mr-2 flex items-center justify-between gap-3 text-[11.5px] text-slate-400">
                {(currentFormat.type === 'photo' || currentFormat.type === 'magnit') && (
                    <div className="flex items-center gap-1">
                        <span>по</span>
                        <button
                            type="button"
                            onClick={() => ChangeCopies(-1)}
                            disabled={Number(currentFormat.copies || 1) <= 1}
                            className="px-1 text-[15px] leading-none text-slate-400 disabled:text-slate-200"
                        >
                            −
                        </button>
                        <span className="min-w-[14px] text-center font-medium text-slate-500 tabular-nums">
                            {currentFormat.copies || 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => ChangeCopies(1)}
                            className="px-1 text-[15px] leading-none text-slate-400"
                        >
                            +
                        </button>
                        <span>шт.</span>
                    </div>
                )}

                <div className="flex items-center gap-3 ml-auto">
                    <span className="flex items-center gap-1.5">
                        <i className="bi bi-images" />
                        {currentFormat.files.length} фото{(currentFormat.type === 'photo' || currentFormat.type === 'magnit') && Number(currentFormat.copies || 1) > 1 ? ` × ${currentFormat.copies}` : ''}
                    </span>
                    <span className="font-semibold text-slate-700 tabular-nums">
                        {totalForFormat} р
                    </span>
                </div>
            </div>

            {/* ===== Сетка фотографий ===== */}
            <div className="mt-4 md:mt-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-2.5">
                <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={load.isLoad}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-2 text-[#53658f] hover:border-[#19766d] hover:bg-teal-50/40 hover:text-[#19766d] active:scale-[0.98] transition disabled:opacity-60"
                >
                    {load.isLoad ? (
                        <>
                            <i className="bi bi-arrow-repeat text-[22px] animate-spin" />
                            <span className="text-[11px] font-medium">{filesPrev?.length || 0} из {load.count}</span>
                        </>
                    ) : (
                        <>
                            <span className="w-10 h-10 rounded-full bg-gray-600/10 flex items-center justify-center">
                                <i className="bi bi-plus-lg text-[20px] text-gray-600" />
                            </span>
                            <span className="text-[11px] text-gray-600 font-semibold">Добавить фото</span>
                        </>
                    )}
                </button>

                {(showAllPhotos ? filesPrev : filesPrev?.slice(0, PHOTO_LIMIT))?.map(el => (
                    <ImgCard
                        key={el.id}
                        image={el}
                        original={formats[item].files.find(file => file.id === el.id)}
                        deleteImg={deleteImg}
                    />
                ))}

                {!showAllPhotos && hiddenCount > 0 && (
                    <button
                        type="button"
                        onClick={() => setShowAllPhotos(true)}
                        className="aspect-square rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        <i className="bi bi-images text-[20px]" />
                        <span className="text-[10.5px] font-semibold text-center leading-tight">
                            и ещё {hiddenCount}<br />фото
                        </span>
                    </button>
                )}

                {showAllPhotos && filesPrev?.length > PHOTO_LIMIT && (
                    <button
                        type="button"
                        onClick={() => setShowAllPhotos(false)}
                        className="aspect-square rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center gap-1 text-slate-400 hover:bg-slate-50 transition-colors"
                    >
                        <i className="bi bi-chevron-up text-[15px]" />
                        <span className="text-[10.5px] font-medium">Свернуть</span>
                    </button>
                )}

                <input
                    className="hidden"
                    ref={fileInput}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/heic,image/webp,image/bmp,.heic"
                    onChange={UploadFiles}
                />
            </div>

            {!!notLoad?.[item]?.length && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2">
                    {notLoad[item].map((el, index) => (
                        <div className="text-[11px] text-red-600 truncate" key={`${el}-${index}`}>
                            {el} — формат не поддерживается
                        </div>
                    ))}
                </div>
            )}

            {/* ===== Действия с форматом ===== */}
            <div className="mt-4 flex items-center justify-end">
                {currentFormat.files.length > 0 ? (
                    <button
                        type="button"
                        onClick={clearPhotos}
                        className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <i className="bi bi-images text-[12px]" />
                        Удалить все фото
                    </button>
                ) :  (
                    <button
                        type="button"
                        onClick={() => onDeleteFormat?.(item)}
                        className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <i className="bi bi-trash3 text-[11px]" />
                        Удалить формат
                    </button>
                ) }
            </div>
        </div>
    );
};