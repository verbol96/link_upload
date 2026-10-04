import { Fragment, useEffect, useMemo, useState } from "react";
import { deleteOldLogs, getLogUser } from "../../http/authApi";
import _ from "lodash";

const PAGE_SIZE=100;

const EVENT_INFO={
    visit:{label:"Посещение",shortLabel:"Визит",icon:"bi-box-arrow-in-right",className:"bg-slate-100 text-slate-600"},
    page_view:{label:"Просмотр страницы",shortLabel:"Страница",icon:"bi-file-earmark",className:"bg-slate-50 text-slate-500"},
    photos_added:{label:"Добавлены фото",shortLabel:"Фото",icon:"bi-images",className:"bg-violet-50 text-violet-700"},
    checkout_opened:{label:"Открыто оформление",shortLabel:"Оформление",icon:"bi-card-checklist",className:"bg-amber-50 text-amber-700"},
    order_submit:{label:"Отправка заказа",shortLabel:"Отправка",icon:"bi-send",className:"bg-blue-50 text-blue-700"},
    order_created:{label:"Заказ создан",shortLabel:"Создан",icon:"bi-check-circle",className:"bg-cyan-50 text-cyan-700"},
    order_upload_completed:{label:"Заказ загружен",shortLabel:"Готово",icon:"bi-cloud-check",className:"bg-emerald-50 text-emerald-700"},
    order_create_error:{label:"Ошибка создания заказа",shortLabel:"Ошибка",icon:"bi-exclamation-triangle",className:"bg-red-50 text-red-600"},
    order_folder_error:{label:"Ошибка папки заказа",shortLabel:"Ошибка",icon:"bi-folder-x",className:"bg-red-50 text-red-600"},
    format_folder_error:{label:"Ошибка папки формата",shortLabel:"Ошибка",icon:"bi-folder-x",className:"bg-red-50 text-red-600"},
    photo_upload_error:{label:"Ошибка загрузки фото",shortLabel:"Ошибка",icon:"bi-exclamation-triangle",className:"bg-red-50 text-red-600"}
};

const SESSION_STEPS=[
    "visit",
    "photos_added",
    "checkout_opened",
    "order_submit",
    "order_created",
    "order_upload_completed"
];

const FILTERS=[
    {id:"all",label:"Все"},
    {id:"errors",label:"Ошибки"},
    {id:"orders",label:"Заказы"},
    {id:"visits",label:"Посещения"}
];

const getEventInfo=(event)=>{
    return EVENT_INFO[event]||{
        label:event||"Событие",
        shortLabel:event||"Событие",
        icon:"bi-circle",
        className:"bg-slate-100 text-slate-600"
    };
};

const formatDate=(iso)=>{
    if(!iso)return{date:"—",time:"—"};
    const value=new Date(iso);
    if(Number.isNaN(value.getTime()))return{date:"—",time:"—"};
    return{
        date:value.toLocaleDateString("ru-RU"),
        time:value.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})
    };
};

const isMobile=(screen)=>{
    if(!screen||typeof screen!=="string")return false;
    const[w,h]=screen.split("x").map(Number);
    if(!w||!h)return false;
    return w<h;
};

const formatDuration=(from,to)=>{
    if(!from||!to)return"—";
    const start=new Date(from).getTime();
    const end=new Date(to).getTime();
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return"—";
    const seconds=Math.floor((end-start)/1000);
    if(seconds<60)return`${seconds} сек`;
    const minutes=Math.floor(seconds/60);
    if(minutes<60)return`${minutes} мин`;
    const hours=Math.floor(minutes/60);
    const restMinutes=minutes%60;
    if(hours<24)return restMinutes?`${hours} ч ${restMinutes} мин`:`${hours} ч`;
    const days=Math.floor(hours/24);
    const restHours=hours%24;
    return restHours?`${days} д ${restHours} ч`:`${days} д`;
};

const buildSessions=(logs)=>{
    const map=new Map();

    logs.forEach((log,index)=>{
        const key=log.sessionId||`legacy-${log.id||index}`;

        if(!map.has(key)){
            map.set(key,{
                id:key,
                sessionId:log.sessionId||null,
                events:[]
            });
        }

        map.get(key).events.push(log);
    });

    return Array.from(map.values()).map(session=>{
        const events=_.orderBy(session.events,"createdAt","asc");
        const firstEvent=events[0]||null;
        const lastEvent=events[events.length-1]||null;
        const orderEvent=[...events].reverse().find(el=>el.orderId);
        const formatEvent=[...events].reverse().find(el=>el.format);
        const userEvent=[...events].reverse().find(el=>el.surname||(el.phone&&el.phone!=="0"));
        const surname=userEvent?.surname||null;
        const phone=userEvent?.phone&&userEvent.phone!=="0"?userEvent.phone:null;
        const photoEvents=events.filter(el=>el.event==="photos_added");
        const latestPhotoEvent=[...events].reverse().find(el=>el.photosCount!=null);
        const photosAddedTotal=photoEvents.reduce((sum,el)=>sum+(Number(el.photosCount)||0),0);
        const photosCount=photosAddedTotal>0?photosAddedTotal:(latestPhotoEvent?.photosCount??null);
        const hasError=events.some(el=>el.eventType==="error");
        const hasOrder=events.some(el=>(el.event&&el.event.startsWith("order_"))||el.event==="format_folder_error"||el.event==="photo_upload_error");
        const hasVisit=events.some(el=>el.event==="visit");
        const reachedSteps=SESSION_STEPS.filter(event=>events.some(el=>el.event===event));
        const lastStep=[...SESSION_STEPS].reverse().find(event=>events.some(el=>el.event===event))||firstEvent?.event||null;

        return{
            ...session,
            events,
            firstEvent,
            lastEvent,
            createdAt:firstEvent?.createdAt||null,
            updatedAt:lastEvent?.createdAt||null,
            surname,
            phone,
            orderId:orderEvent?.orderId||null,
            format:formatEvent?.format||null,
            photosCount,
            hasError,
            hasOrder,
            hasVisit,
            reachedSteps,
            lastStep
        };
    }).sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0));
};

const LogsUser=()=>{
    const[logs,setLogs]=useState([]);
    const[loading,setLoading]=useState(true);
    const[visibleCount,setVisibleCount]=useState(PAGE_SIZE);
    const[expandedId,setExpandedId]=useState(null);
    const[filter,setFilter]=useState("all");
    const[search,setSearch]=useState("");

    useEffect(()=>{
        const getData=async()=>{
            try{
                await deleteOldLogs();
                const data=await getLogUser();
                setLogs(_.orderBy(data,"createdAt","desc"));
            }catch(err){
                console.error(err);
            }finally{
                setLoading(false);
            }
        };

        getData();
    },[]);

    const sessions=useMemo(()=>buildSessions(logs),[logs]);

    const filteredSessions=useMemo(()=>{
        let result=sessions;

        if(filter==="errors"){
            result=result.filter(session=>session.hasError);
        }

        if(filter==="orders"){
            result=result.filter(session=>session.hasOrder);
        }

        if(filter==="visits"){
            result=result.filter(session=>session.hasVisit);
        }

        const value=search.trim().toLowerCase();

        if(value){
            result=result.filter(session=>{
                const sessionId=String(session.sessionId||"").toLowerCase();
                const surname=String(session.surname||"").toLowerCase();
                const phone=String(session.phone||"").toLowerCase();
                const orderId=String(session.orderId||"").toLowerCase();
                const format=String(session.format||"").toLowerCase();

                const eventMatch=session.events.some(el=>{
                    const event=String(el.event||"").toLowerCase();
                    const page=String(el.page||"").toLowerCase();
                    const error=String(el.error||"").toLowerCase();
                    const device=String(el.device||"").toLowerCase();
                    const browser=String(el.browser||"").toLowerCase();
                    const os=String(el.OS||"").toLowerCase();

                    return event.includes(value)||page.includes(value)||error.includes(value)||device.includes(value)||browser.includes(value)||os.includes(value);
                });

                return sessionId.includes(value)||surname.includes(value)||phone.includes(value)||orderId.includes(value)||format.includes(value)||eventMatch;
            });
        }

        return result;
    },[sessions,filter,search]);

    useEffect(()=>{
        setVisibleCount(PAGE_SIZE);
        setExpandedId(null);
    },[filter,search]);

    const visibleSessions=filteredSessions.slice(0,visibleCount);
    const hasMore=visibleCount<filteredSessions.length;
    const errorsCount=sessions.filter(session=>session.hasError).length;
    const ordersCount=sessions.filter(session=>session.hasOrder).length;
    const visitsCount=sessions.filter(session=>session.hasVisit).length;

    const getFilterCount=(id)=>{
        if(id==="errors")return errorsCount;
        if(id==="orders")return ordersCount;
        if(id==="visits")return visitsCount;
        return sessions.length;
    };

    return (
        <div className="w-full">
            <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                <div className="px-3 sm:px-4 py-3 bg-slate-50 border-b border-slate-200/80">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="w-7 h-7 rounded-md bg-[#eaf4f2] flex items-center justify-center shrink-0">
                                <i className="bi bi-list-ul text-[12px] text-[#19766d]"/>
                            </span>
                            <div>
                                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-600">Сессии пользователей</div>
                                <div className="text-[10px] text-slate-400">{filteredSessions.length===sessions.length?`${sessions.length} сессий`:`${filteredSessions.length} из ${sessions.length}`}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 overflow-x-auto lg:ml-3">
                            {FILTERS.map(item=>(
                                <button key={item.id} type="button" onClick={()=>setFilter(item.id)} className={`shrink-0 h-8 px-2.5 rounded-md text-[11px] font-medium transition-colors ${filter===item.id?"bg-[#19766d] text-white":"bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"}`}>
                                    {item.label}
                                    <span className={`ml-1.5 text-[9px] ${filter===item.id?"text-white/70":"text-slate-400"}`}>{getFilterCount(item.id)}</span>
                                </button>
                            ))}
                        </div>

                        <div className="relative lg:ml-auto w-full lg:w-[300px]">
                            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400"/>
                            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Фамилия, телефон, заказ..." className="w-full h-8 pl-8 pr-8 rounded-md border border-slate-200 bg-white outline-none text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-[#19766d]"/>
                            {search&&<button type="button" onClick={()=>setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700"><i className="bi bi-x-lg text-[9px]"/></button>}
                        </div>
                    </div>
                </div>

                {loading?(
                    <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-[13px]">
                        <i className="bi bi-arrow-repeat animate-spin"/>
                        Загрузка...
                    </div>
                ):filteredSessions.length===0?(
                    <div className="py-12 text-center text-slate-400 text-[13px]">
                        <i className="bi bi-inbox text-[24px] block mb-2 opacity-50"/>
                        {sessions.length===0?"Пока нет сессий":"Ничего не найдено"}
                    </div>
                ):(
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full table-fixed text-[12.5px]">
                                <colgroup>
                                    <col className="w-[90px]"/>
                                    <col className="w-[150px]"/>
                                    <col/>
                                    <col className="w-[130px]"/>
                                    <col className="w-[170px]"/>
                                    <col className="w-[80px]"/>
                                    <col className="w-[100px]"/>
                                </colgroup>
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                                        <th className="text-left px-4 py-2">Время</th>
                                        <th className="text-left px-4 py-2">Пользователь</th>
                                        <th className="text-left px-4 py-2">Сессия</th>
                                        <th className="text-left px-4 py-2">Заказ</th>
                                        <th className="text-left px-4 py-2">Формат</th>
                                        <th className="text-right px-4 py-2">Фото</th>
                                        <th className="text-right px-4 py-2">Время</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleSessions.map((session,index)=>{
                                        const{date,time}=formatDate(session.createdAt);
                                        const previousDate=index>0?formatDate(visibleSessions[index-1].createdAt).date:null;
                                        const isNewDay=index===0||date!==previousDate;
                                        const expanded=expandedId===session.id;
                                        const lastInfo=getEventInfo(session.lastStep);
                                        const duration=formatDuration(session.createdAt,session.updatedAt);

                                        return (
                                            <Fragment key={session.id}>
                                                {isNewDay&&(
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-1.5 bg-slate-50 border-y border-slate-200">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#19766d]"/>
                                                                <span className="text-[10px] font-semibold tracking-wide text-slate-500">{date}</span>
                                                                <span className="h-px flex-1 bg-slate-200"/>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}

                                                <tr onClick={()=>setExpandedId(prev=>prev===session.id?null:session.id)} className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer ${expanded?"bg-slate-50/70":""}`}>
                                                    <td className="px-4 py-2.5 text-slate-500 tabular-nums">{time}</td>
                                                    <td className="px-4 py-2.5">
                                                        {session.surname?(
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <i className="bi bi-person text-[11px] text-[#19766d] shrink-0"/>
                                                                    <span className="text-[11px] font-medium text-slate-700 truncate capitalize">{session.surname}</span>
                                                                </div>
                                                                {session.phone&&<div className="mt-0.5 text-[9px] text-slate-400 truncate">{session.phone}</div>}
                                                            </div>
                                                        ):(
                                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                                <i className="bi bi-person-x text-[11px] shrink-0"/>
                                                                <span className="text-[10px]">Не авторизован</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            {session.reachedSteps.map((event,stepIndex)=>{
                                                                const info=getEventInfo(event);

                                                                return (
                                                                    <Fragment key={event}>
                                                                        {stepIndex>0&&<i className="bi bi-chevron-right text-[7px] text-slate-300 shrink-0"/>}
                                                                        <span title={info.label} className={`h-7 px-2 rounded-md inline-flex items-center gap-1.5 shrink-0 ${info.className}`}>
                                                                            <i className={`bi ${info.icon} text-[11px]`}/>
                                                                            <span className="text-[10px] font-medium hidden 2xl:inline">{info.shortLabel}</span>
                                                                        </span>
                                                                    </Fragment>
                                                                );
                                                            })}

                                                            {session.hasError&&(
                                                                <>
                                                                    <i className="bi bi-chevron-right text-[7px] text-slate-300 shrink-0"/>
                                                                    <span className="h-7 px-2 rounded-md inline-flex items-center gap-1.5 shrink-0 bg-red-50 text-red-600">
                                                                        <i className="bi bi-exclamation-triangle text-[11px]"/>
                                                                        <span className="text-[10px] font-medium hidden 2xl:inline">Ошибка</span>
                                                                    </span>
                                                                </>
                                                            )}

                                                            {session.reachedSteps.length===0&&(
                                                                <span className={`h-7 px-2 rounded-md inline-flex items-center gap-1.5 ${lastInfo.className}`}>
                                                                    <i className={`bi ${lastInfo.icon} text-[11px]`}/>
                                                                    <span className="text-[10px] font-medium">{lastInfo.shortLabel}</span>
                                                                </span>
                                                            )}

                                                            <i className={`bi ${expanded?"bi-chevron-up":"bi-chevron-down"} ml-auto text-[9px] text-slate-300 shrink-0`}/>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-slate-600 truncate">{session.orderId?`№${session.orderId}`:"—"}</td>
                                                    <td className="px-4 py-2.5 text-slate-600 truncate">{session.format||"—"}</td>
                                                    <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">{session.photosCount??"—"}</td>
                                                    <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums">{duration}</td>
                                                </tr>

                                                {expanded&&(
                                                    <tr className="bg-slate-50/70 border-b border-slate-200">
                                                        <td colSpan={7} className="px-4 py-4">
                                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                                                <div>
                                                                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">События сессии</div>
                                                                    <div className="mt-0.5 text-[10px] text-slate-400">{session.events.length} событий · {duration}</div>
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    {session.surname&&(
                                                                        <div className="text-right">
                                                                            <div className="text-[10px] font-medium text-slate-600 capitalize">{session.surname}</div>
                                                                            {session.phone&&<div className="text-[9px] text-slate-400">{session.phone}</div>}
                                                                        </div>
                                                                    )}
                                                                    {session.sessionId&&<div className="max-w-[280px] truncate text-[9px] font-mono text-slate-400" title={session.sessionId}>{session.sessionId}</div>}
                                                                </div>
                                                            </div>

                                                            <div className="relative">
                                                                <div className="absolute left-[13px] top-3 bottom-3 w-px bg-slate-200"/>
                                                                <div className="space-y-1">
                                                                    {session.events.map((event,eventIndex)=>{
                                                                        const eventInfo=getEventInfo(event.event);
                                                                        const eventTime=formatDate(event.createdAt);
                                                                        const mobile=isMobile(event.screen);

                                                                        return (
                                                                            <div key={event.id||eventIndex} className="relative flex gap-3">
                                                                                <div className={`relative z-10 w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${eventInfo.className}`}>
                                                                                    <i className={`bi ${eventInfo.icon} text-[11px]`}/>
                                                                                </div>
                                                                                <div className="min-w-0 flex-1 pb-3">
                                                                                    <div className="flex items-center gap-2 min-h-7">
                                                                                        <span className="text-[11px] font-medium text-slate-700">{eventInfo.label}</span>
                                                                                        <span className="text-[10px] text-slate-400 tabular-nums">{eventTime.time}</span>
                                                                                        {event.page&&<span className="text-[10px] font-mono text-[#19766d]">{event.page}</span>}
                                                                                        {event.orderId&&<span className="text-[10px] text-slate-500">№{event.orderId}</span>}
                                                                                        {event.photosCount!=null&&<span className="text-[10px] text-slate-400">{event.photosCount} фото</span>}
                                                                                        {event.format&&<span className="text-[10px] text-slate-400 truncate">{event.format}</span>}
                                                                                    </div>

                                                                                    {event.error&&(
                                                                                        <div className="mt-1 p-2.5 rounded-lg bg-red-50 border border-red-100">
                                                                                            <div className="text-[11px] leading-relaxed text-red-700 break-words">{event.error}</div>
                                                                                        </div>
                                                                                    )}

                                                                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400">
                                                                                        {event.device&&<span><i className={`bi ${mobile?"bi-phone":"bi-display"} mr-1`}/>{event.device}</span>}
                                                                                        {event.OS&&<span>{event.OS}</span>}
                                                                                        {event.browser&&<span>{event.browser}</span>}
                                                                                        {event.screen&&<span>{event.screen}</span>}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden">
                            {visibleSessions.map((session,index)=>{
                                const{date,time}=formatDate(session.createdAt);
                                const previousDate=index>0?formatDate(visibleSessions[index-1].createdAt).date:null;
                                const isNewDay=index===0||date!==previousDate;
                                const expanded=expandedId===session.id;
                                const duration=formatDuration(session.createdAt,session.updatedAt);
                                const lastInfo=getEventInfo(session.lastStep);

                                return (
                                    <div key={session.id}>
                                        {isNewDay&&(
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-y border-slate-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#19766d]"/>
                                                <span className="text-[10px] font-semibold text-slate-500">{date}</span>
                                                <span className="h-px flex-1 bg-slate-200"/>
                                            </div>
                                        )}

                                        <button type="button" onClick={()=>setExpandedId(prev=>prev===session.id?null:session.id)} className={`w-full px-3 py-2.5 text-left border-b border-slate-100 ${expanded?"bg-slate-50":"bg-white"}`}>
                                            <div className="flex items-start gap-2">
                                                <span className="w-[38px] shrink-0 pt-1 text-[11px] text-slate-400 tabular-nums">{time}</span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        {session.surname?(
                                                            <>
                                                                <i className="bi bi-person text-[11px] text-[#19766d]"/>
                                                                <span className="text-[11px] font-medium text-slate-700 capitalize truncate">{session.surname}</span>
                                                            </>
                                                        ):(
                                                            <>
                                                                <i className="bi bi-person-x text-[11px] text-slate-400"/>
                                                                <span className="text-[10px] text-slate-400">Не авторизован</span>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 overflow-hidden">
                                                        {session.reachedSteps.map((event,stepIndex)=>{
                                                            const info=getEventInfo(event);

                                                            return (
                                                                <Fragment key={event}>
                                                                    {stepIndex>0&&<i className="bi bi-chevron-right text-[6px] text-slate-300 shrink-0"/>}
                                                                    <span title={info.label} className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${info.className}`}>
                                                                        <i className={`bi ${info.icon} text-[11px]`}/>
                                                                    </span>
                                                                </Fragment>
                                                            );
                                                        })}

                                                        {session.hasError&&(
                                                            <>
                                                                <i className="bi bi-chevron-right text-[6px] text-slate-300 shrink-0"/>
                                                                <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-red-50 text-red-600">
                                                                    <i className="bi bi-exclamation-triangle text-[11px]"/>
                                                                </span>
                                                            </>
                                                        )}

                                                        {session.reachedSteps.length===0&&(
                                                            <span className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${lastInfo.className}`}>
                                                                <i className={`bi ${lastInfo.icon} text-[11px]`}/>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {(session.orderId||session.format||session.photosCount!=null)&&(
                                                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 truncate">
                                                            {session.orderId&&<span>№{session.orderId}</span>}
                                                            {session.format&&<span className="truncate">{session.format}</span>}
                                                            {session.photosCount!=null&&<span className="shrink-0">{session.photosCount} фото</span>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="shrink-0 pt-1 text-right">
                                                    <div className="text-[9px] text-slate-400">{duration}</div>
                                                    <i className={`bi ${expanded?"bi-chevron-up":"bi-chevron-down"} text-[9px] text-slate-300`}/>
                                                </div>
                                            </div>
                                        </button>

                                        {expanded&&(
                                            <div className="px-3 py-3 bg-slate-50/70 border-b border-slate-200">
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <div>
                                                        <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">События сессии</div>
                                                        <div className="text-[9px] text-slate-400">{session.events.length} событий · {duration}</div>
                                                    </div>

                                                    {session.surname&&(
                                                        <div className="text-right">
                                                            <div className="text-[10px] font-medium text-slate-600 capitalize">{session.surname}</div>
                                                            {session.phone&&<div className="text-[9px] text-slate-400">{session.phone}</div>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="relative">
                                                    <div className="absolute left-[13px] top-3 bottom-3 w-px bg-slate-200"/>
                                                    <div className="space-y-1">
                                                        {session.events.map((event,eventIndex)=>{
                                                            const eventInfo=getEventInfo(event.event);
                                                            const eventTime=formatDate(event.createdAt);

                                                            return (
                                                                <div key={event.id||eventIndex} className="relative flex gap-3">
                                                                    <div className={`relative z-10 w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${eventInfo.className}`}>
                                                                        <i className={`bi ${eventInfo.icon} text-[11px]`}/>
                                                                    </div>
                                                                    <div className="min-w-0 flex-1 pb-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[11px] font-medium text-slate-700">{eventInfo.label}</span>
                                                                            <span className="ml-auto shrink-0 text-[10px] text-slate-400 tabular-nums">{eventTime.time}</span>
                                                                        </div>

                                                                        {event.page&&<div className="mt-0.5 text-[9px] font-mono text-[#19766d] break-all">{event.page}</div>}

                                                                        {(event.orderId||event.format||event.photosCount!=null)&&(
                                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[9px] text-slate-400">
                                                                                {event.orderId&&<span>№{event.orderId}</span>}
                                                                                {event.format&&<span>{event.format}</span>}
                                                                                {event.photosCount!=null&&<span>{event.photosCount} фото</span>}
                                                                            </div>
                                                                        )}

                                                                        {event.error&&(
                                                                            <div className="mt-1.5 p-2 rounded-lg bg-red-50 border border-red-100">
                                                                                <div className="text-[10px] leading-relaxed text-red-700 break-words">{event.error}</div>
                                                                            </div>
                                                                        )}

                                                                        <div className="mt-1.5 text-[9px] text-slate-400 space-y-0.5">
                                                                            {(event.device||event.OS)&&<div>{[event.device,event.OS].filter(Boolean).join(" · ")}</div>}
                                                                            {event.browser&&<div className="break-all">{event.browser}</div>}
                                                                            {event.screen&&<div>{event.screen}</div>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {session.sessionId&&(
                                                    <div className="mt-1 pt-2 border-t border-slate-200">
                                                        <div className="text-[8px] uppercase tracking-wider font-semibold text-slate-400">Session ID</div>
                                                        <div className="mt-0.5 text-[9px] font-mono text-slate-400 break-all">{session.sessionId}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {hasMore&&(
                            <div className="flex justify-center px-4 py-4 border-t border-slate-100">
                                <button type="button" onClick={()=>setVisibleCount(prev=>prev+PAGE_SIZE)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-medium text-slate-600 transition-colors">
                                    <i className="bi bi-chevron-down text-[10px]"/>
                                    Показать ещё
                                    <span className="text-[10px] text-slate-400">({Math.min(PAGE_SIZE,filteredSessions.length-visibleCount)})</span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default LogsUser;