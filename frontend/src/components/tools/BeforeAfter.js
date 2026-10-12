import { useEffect,useRef,useState } from "react";

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const initialCrop=()=>({zoom:1,x:0,y:0});

const BeforeAfter=()=>{
    const [beforeUrl,setBeforeUrl]=useState("");
    const [afterUrl,setAfterUrl]=useState("");
    const [ratio,setRatio]=useState(3/2);
    const [position,setPosition]=useState(50);
    const [mode,setMode]=useState("side");
    const [clean,setClean]=useState(false);
    const [beforeCrop,setBeforeCrop]=useState(initialCrop);
    const [afterCrop,setAfterCrop]=useState(initialCrop);
    const beforeInputRef=useRef(null);
    const afterInputRef=useRef(null);
    const beforeUrlRef=useRef("");
    const afterUrlRef=useRef("");
    const compareRef=useRef(null);
    const beforeCropRef=useRef(null);
    const afterCropRef=useRef(null);
    const dragRef=useRef(null);
    const sliderDragRef=useRef(false);
    const bothLoaded=Boolean(beforeUrl&&afterUrl);

    useEffect(()=>{
        return()=>{
            if(beforeUrlRef.current)URL.revokeObjectURL(beforeUrlRef.current);
            if(afterUrlRef.current)URL.revokeObjectURL(afterUrlRef.current);
        };
    },[]);

    const loadImage=(file,type)=>{
        if(!file)return;
        const url=URL.createObjectURL(file);
        const img=new Image();
        img.onload=()=>{
            if(type==="before"){
                if(beforeUrlRef.current)URL.revokeObjectURL(beforeUrlRef.current);
                beforeUrlRef.current=url;
                setBeforeUrl(url);
                setBeforeCrop(initialCrop());
                setRatio(img.naturalWidth/img.naturalHeight);
            }else{
                if(afterUrlRef.current)URL.revokeObjectURL(afterUrlRef.current);
                afterUrlRef.current=url;
                setAfterUrl(url);
                setAfterCrop(initialCrop());
                if(!beforeUrlRef.current)setRatio(img.naturalWidth/img.naturalHeight);
            }
        };
        img.onerror=()=>URL.revokeObjectURL(url);
        img.src=url;
    };

    const updateCrop=(type,updater)=>{
        const setter=type==="before"?setBeforeCrop:setAfterCrop;
        setter(prev=>{
            const next=typeof updater==="function"?updater(prev):updater;
            const zoom=clamp(next.zoom,1,5);
            const limit=(zoom-1)/2;
            return {zoom,x:clamp(next.x,-limit,limit),y:clamp(next.y,-limit,limit)};
        });
    };
    const changeZoom=(type,delta)=>{
        updateCrop(type,prev=>({...prev,zoom:Number((prev.zoom+delta).toFixed(2))}));
    };
    const resetCrop=(type)=>updateCrop(type,initialCrop());

    const handleCropDown=(e,type)=>{
        if(e.pointerType==="mouse"&&e.button!==0)return;
        const crop=type==="before"?beforeCrop:afterCrop;
        dragRef.current={type,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:crop.x,y:crop.y};
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const handleCropMove=(e,type)=>{
        const drag=dragRef.current;
        if(!drag||drag.type!==type||drag.pointerId!==e.pointerId)return;
        const rect=e.currentTarget.getBoundingClientRect();
        if(!rect.width||!rect.height)return;
        const x=drag.x+(e.clientX-drag.startX)/rect.width;
        const y=drag.y+(e.clientY-drag.startY)/rect.height;
        updateCrop(type,prev=>({...prev,x,y}));
    };
    const handleCropUp=(e)=>{
        if(dragRef.current?.pointerId===e.pointerId)dragRef.current=null;
    };
    const moveSlider=(clientX)=>{
        const rect=compareRef.current?.getBoundingClientRect();
        if(!rect?.width)return;
        setPosition(clamp((clientX-rect.left)/rect.width*100,0,100));
    };
    const handleSliderDown=(e)=>{
        if(e.pointerType==="mouse"&&e.button!==0)return;
        sliderDragRef.current=true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        moveSlider(e.clientX);
    };
    const handleSliderMove=(e)=>{
        if(sliderDragRef.current)moveSlider(e.clientX);
    };
    const handleSliderUp=()=>{sliderDragRef.current=false};

    const imageStyle=(crop)=>({
        transform:`translate(${crop.x*100}%,${crop.y*100}%) scale(${crop.zoom})`,
        transformOrigin:"center center"
    });
    const renderImage=(url,crop,label)=>url?<img src={url} alt={label} draggable="false" className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={imageStyle(crop)}/>:null;
    const renderCompare=()=>{
        if(!bothLoaded)return null;
        return(
            <div ref={compareRef} onPointerDown={handleSliderDown} onPointerMove={handleSliderMove} onPointerUp={handleSliderUp} onPointerCancel={handleSliderUp} className="relative mx-auto w-full overflow-hidden select-none touch-none bg-slate-100 cursor-ew-resize" style={{aspectRatio:ratio,maxHeight:clean?"100vh":"75vh"}}>
                {renderImage(afterUrl,afterCrop,"После")}
                <div className="absolute inset-0 pointer-events-none" style={{clipPath:`inset(0 ${100-position}% 0 0)`}}>
                    {renderImage(beforeUrl,beforeCrop,"До")}
                </div>
                <div className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] pointer-events-none" style={{left:`${position}%`}}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-[#19766d]">
                        <i className="bi bi-chevron-left text-[12px]"/><i className="bi bi-chevron-right text-[12px]"/>
                    </div>
                </div>
                <span className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/55 text-white text-[11px] font-semibold pointer-events-none">ДО</span>
                <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-[#19766d]/90 text-white text-[11px] font-semibold pointer-events-none">ПОСЛЕ</span>
            </div>
        );
    };
    const renderEditor=(type)=>{
        const isBefore=type==="before";
        const url=isBefore?beforeUrl:afterUrl;
        const crop=isBefore?beforeCrop:afterCrop;
        const label=isBefore?"До":"После";
        return(
            <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-slate-700">{label}</span>
                    <button type="button" onClick={()=>(isBefore?beforeInputRef:afterInputRef).current?.click()} className="text-[11px] font-medium text-[#19766d] hover:underline">{url?"Заменить фото":"Выбрать фото"}</button>
                </div>
                <div ref={isBefore?beforeCropRef:afterCropRef} onPointerDown={url?e=>handleCropDown(e,type):undefined} onPointerMove={url?e=>handleCropMove(e,type):undefined} onPointerUp={handleCropUp} onPointerCancel={handleCropUp} className={`relative w-full overflow-hidden rounded-lg bg-slate-100 select-none ${url?"touch-none cursor-grab active:cursor-grabbing":""}`} style={{aspectRatio:ratio}}>
                    {url?renderImage(url,crop,label):(
                        <button type="button" onClick={()=>(isBefore?beforeInputRef:afterInputRef).current?.click()} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-[#19766d] transition">
                            <i className={`bi ${isBefore?"bi-image":"bi-stars"} text-[25px]`}/>
                            <span className="mt-2 text-[12px]">Добавить фото «{label}»</span>
                        </button>
                    )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 min-h-9">
                    <span className="text-[10px] text-slate-400">{url?"Перетаскивайте фото для кадрирования":"Масштаб и положение"}</span>
                    <div className="flex items-center gap-1">
                        <button type="button" disabled={!url||crop.zoom<=1} onClick={()=>changeZoom(type,-0.2)} className="w-8 h-8 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30" title="Уменьшить"><i className="bi bi-dash-lg"/></button>
                        <span className="w-12 text-center text-[11px] text-slate-500 tabular-nums">{Math.round(crop.zoom*100)}%</span>
                        <button type="button" disabled={!url||crop.zoom>=5} onClick={()=>changeZoom(type,0.2)} className="w-8 h-8 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30" title="Увеличить"><i className="bi bi-plus-lg"/></button>
                        <button type="button" disabled={!url} onClick={()=>resetCrop(type)} className="w-8 h-8 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30" title="Сбросить"><i className="bi bi-arrow-counterclockwise"/></button>
                    </div>
                </div>
            </div>
        );
    };

    if(clean)return(
        <div className="fixed inset-0 z-[100] bg-[#111] flex items-center justify-center p-0 md:p-6">
            {renderCompare()}
            <button type="button" onClick={()=>setClean(false)} className="fixed top-4 right-4 z-[110] w-10 h-10 rounded-full bg-black/45 hover:bg-black/65 text-white transition" title="Вернуть интерфейс"><i className="bi bi-x-lg"/></button>
        </div>
    );
    return(
        <div>
            <div className="mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div><h2 className="text-[17px] font-semibold text-slate-800">До / После</h2><div className="mt-0.5 text-[11.5px] text-slate-400">Настройте кадр каждого фото и сравните результат</div></div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-9 rounded-lg border border-slate-200 bg-white p-1">
                        <button type="button" onClick={()=>setMode("side")} className={`px-3 rounded-md text-[12px] font-medium transition ${mode==="side"?"bg-[#eaf4f2] text-[#19766d]":"text-slate-500 hover:text-slate-800"}`}>Кадрирование</button>
                        <button type="button" onClick={()=>setMode("slider")} className={`px-3 rounded-md text-[12px] font-medium transition ${mode==="slider"?"bg-[#eaf4f2] text-[#19766d]":"text-slate-500 hover:text-slate-800"}`}>Слайдер</button>
                    </div>
                    <button type="button" onClick={()=>setClean(true)} disabled={!bothLoaded} className="h-9 px-3 rounded-lg bg-[#19766d] disabled:opacity-40 text-white text-[12px] font-medium hover:bg-[#155f58] transition"><i className="bi bi-arrows-fullscreen mr-2"/>Режим показа</button>
                </div>
            </div>
            <input ref={beforeInputRef} type="file" accept="image/*" className="hidden" onChange={e=>{loadImage(e.target.files?.[0],"before");e.target.value=""}}/>
            <input ref={afterInputRef} type="file" accept="image/*" className="hidden" onChange={e=>{loadImage(e.target.files?.[0],"after");e.target.value=""}}/>
            <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] p-2 md:p-4">
                {mode==="side"?(
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">{renderEditor("before")}{renderEditor("after")}</div>
                ):bothLoaded?renderCompare():(
                    <div className="min-h-[45vh] flex flex-col items-center justify-center text-center text-slate-400">
                        <i className="bi bi-images text-[25px]"/>
                        <div className="mt-3 text-[13px] font-medium">Для сравнения нужны оба фото</div>
                        <button type="button" onClick={()=>setMode("side")} className="mt-3 text-[12px] font-medium text-[#19766d] hover:underline">Перейти к кадрированию</button>
                    </div>
                )}
            </div>
            {mode==="slider"&&bothLoaded&&<div className="mt-2 text-center text-[11px] text-slate-400">Двигайте разделитель для сравнения. Кадрирование меняется только во вкладке «Кадрирование».</div>}
        </div>
    );
};

export default BeforeAfter;
