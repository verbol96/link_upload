import { useRef, useState } from "react";
const BeforeAfter=()=>{
    const [beforeUrl,setBeforeUrl]=useState("");
    const [afterUrl,setAfterUrl]=useState("");
    const [position,setPosition]=useState(50);
    const [mode,setMode]=useState("slider");
    const [clean,setClean]=useState(false);
    const [ratio,setRatio]=useState(3/2);
    const compareRef=useRef(null);
    const beforeInputRef=useRef(null);
    const afterInputRef=useRef(null);
    const loadImage=(file,type)=>{
        if(!file) return;
        const url=URL.createObjectURL(file);
        const img=new Image();
        img.onload=()=>{
            if(img.naturalWidth&&img.naturalHeight) setRatio(img.naturalWidth/img.naturalHeight);
            if(type==="before"){if(beforeUrl) URL.revokeObjectURL(beforeUrl);setBeforeUrl(url)}else{if(afterUrl) URL.revokeObjectURL(afterUrl);setAfterUrl(url)}
        };
        img.src=url;
    };
    const moveSlider=(clientX)=>{
        if(!compareRef.current) return;
        const rect=compareRef.current.getBoundingClientRect();
        setPosition(Math.max(0,Math.min(100,((clientX-rect.left)/rect.width)*100)));
    };
    const handlePointerDown=(e)=>{if(!beforeUrl||!afterUrl)return;e.currentTarget.setPointerCapture?.(e.pointerId);moveSlider(e.clientX)};
    const handlePointerMove=(e)=>{if(e.buttons!==1&&e.pointerType==="mouse")return;if(e.currentTarget.hasPointerCapture?.(e.pointerId)||e.pointerType!=="mouse")moveSlider(e.clientX)};
    const toggleFullscreen=async()=>{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else await document.exitFullscreen?.()};
    const bothLoaded=beforeUrl&&afterUrl;
    if(clean)return <div className="fixed inset-0 z-[100] bg-[#111] flex items-center justify-center p-0 md:p-6">{bothLoaded&&<div ref={compareRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} className="relative mx-auto w-full overflow-hidden select-none touch-none bg-black" style={{aspectRatio:ratio,maxHeight:"100vh"}}><img src={afterUrl} alt="После" draggable="false" className="absolute inset-0 w-full h-full object-contain pointer-events-none"/><img src={beforeUrl} alt="До" draggable="false" className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={{clipPath:`inset(0 ${100-position}% 0 0)`}}/><div className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.45)] pointer-events-none" style={{left:`${position}%`}}><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-[#19766d]"><i className="bi bi-chevron-left text-[12px]"/><i className="bi bi-chevron-right text-[12px]"/></div></div><span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-semibold tracking-wide pointer-events-none">ДО</span><span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-[#19766d]/90 backdrop-blur-sm text-white text-[11px] font-semibold tracking-wide pointer-events-none">ПОСЛЕ</span></div>}<button type="button" onClick={()=>setClean(false)} className="fixed top-4 right-4 z-[110] w-10 h-10 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-sm text-white transition opacity-30 hover:opacity-100" title="Вернуть интерфейс"><i className="bi bi-x-lg"/></button></div>;
    return (
        <div>
            <div className="mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div><h2 className="text-[17px] font-semibold text-slate-800">До / После</h2><div className="mt-0.5 text-[11.5px] text-slate-400">Сравнение исходного и обработанного изображения</div></div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-9 rounded-lg border border-slate-200 bg-white p-1"><button type="button" onClick={()=>setMode("slider")} className={`px-3 rounded-md text-[12px] font-medium transition ${mode==="slider"?"bg-[#eaf4f2] text-[#19766d]":"text-slate-500 hover:text-slate-800"}`}>Слайдер</button><button type="button" onClick={()=>setMode("side")} className={`px-3 rounded-md text-[12px] font-medium transition ${mode==="side"?"bg-[#eaf4f2] text-[#19766d]":"text-slate-500 hover:text-slate-800"}`}>Рядом</button></div>
                    <button type="button" onClick={toggleFullscreen} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition"><i className="bi bi-arrows-fullscreen mr-2"/>На весь экран</button>
                    <button type="button" onClick={()=>setClean(true)} disabled={!bothLoaded} className="h-9 px-3 rounded-lg bg-[#19766d] disabled:opacity-40 text-white text-[12px] font-medium hover:bg-[#155f58] transition"><i className="bi bi-eye mr-2"/>Режим показа</button>
                </div>
            </div>
            <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" onClick={()=>beforeInputRef.current?.click()} className="h-11 rounded-lg border border-slate-200 bg-white px-4 flex items-center justify-center gap-2 text-[12.5px] font-medium text-slate-600 hover:border-[#19766d]/40 hover:text-[#19766d] transition"><i className="bi bi-image"/>{beforeUrl?"Заменить фото «До»":"Добавить фото «До»"}</button>
                <button type="button" onClick={()=>afterInputRef.current?.click()} className="h-11 rounded-lg border border-slate-200 bg-white px-4 flex items-center justify-center gap-2 text-[12.5px] font-medium text-slate-600 hover:border-[#19766d]/40 hover:text-[#19766d] transition"><i className="bi bi-stars"/>{afterUrl?"Заменить фото «После»":"Добавить фото «После»"}</button>
                <input ref={beforeInputRef} type="file" accept="image/*" className="hidden" onChange={e=>loadImage(e.target.files?.[0],"before")}/>
                <input ref={afterInputRef} type="file" accept="image/*" className="hidden" onChange={e=>loadImage(e.target.files?.[0],"after")}/>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] p-2 md:p-4">
                {!bothLoaded?<div className="min-h-[55vh] flex flex-col items-center justify-center text-center"><div className="w-14 h-14 rounded-full bg-[#eaf4f2] flex items-center justify-center text-[#19766d]"><i className="bi bi-images text-[22px]"/></div><div className="mt-3 text-[14px] font-semibold text-slate-700">Добавьте два изображения</div></div>:mode==="slider"?<div ref={compareRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} className="relative mx-auto w-full overflow-hidden select-none touch-none rounded-lg bg-slate-100" style={{aspectRatio:ratio,maxHeight:"72vh"}}><img src={afterUrl} alt="После" draggable="false" className="absolute inset-0 w-full h-full object-contain pointer-events-none"/><img src={beforeUrl} alt="До" draggable="false" className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={{clipPath:`inset(0 ${100-position}% 0 0)`}}/><div className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.45)] pointer-events-none" style={{left:`${position}%`}}><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-[#19766d]"><i className="bi bi-chevron-left text-[12px]"/><i className="bi bi-chevron-right text-[12px]"/></div></div><span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-semibold tracking-wide pointer-events-none">ДО</span><span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-[#19766d]/90 backdrop-blur-sm text-white text-[11px] font-semibold tracking-wide pointer-events-none">ПОСЛЕ</span></div>:<div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3"><div className="relative overflow-hidden rounded-lg bg-slate-100"><img src={beforeUrl} alt="До" className="w-full h-full max-h-[72vh] object-contain"/><span className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/55 text-white text-[11px] font-semibold">ДО</span></div><div className="relative overflow-hidden rounded-lg bg-slate-100"><img src={afterUrl} alt="После" className="w-full h-full max-h-[72vh] object-contain"/><span className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-[#19766d]/90 text-white text-[11px] font-semibold">ПОСЛЕ</span></div></div>}
            </div>
        </div>
    );
};
export default BeforeAfter;
