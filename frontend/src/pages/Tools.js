import { useState } from "react";
import { NavBar } from "../components/admin/NavBar";
import BeforeAfter from "../components/tools/BeforeAfter";
import LogsUser from "../components/tools/LogsUser";
import History from "../components/tools/History";

const TOOLS = [
    {id:"beforeAfter",title:"До / После",description:"Сравнение изображений",icon:"bi-images"},
    {id:"logs",title:"Логи",description:"Действия пользователей",icon:"bi-list-ul"},
    {id:"history",title:"История",description:"Обновления сайта",icon:"bi-clock-history"}
];

const Tools = () => {
    const [activeTool,setActiveTool] = useState("logs");
    const [menuOpen,setMenuOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-[#F5F6F8]">
            <NavBar />
            <main className="flex-1 mx-auto w-full min-w-0 px-2 md:w-[90%] md:px-0 py-3 md:py-5">
                <div className="lg:hidden mb-3 flex rounded-lg border border-slate-200 bg-white overflow-hidden divide-x divide-slate-200">
                    {TOOLS.map(tool => (
                        <button key={tool.id} type="button" onClick={()=>setActiveTool(tool.id)} aria-pressed={activeTool===tool.id} className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 px-1 py-2.5 text-[12px] font-medium ${activeTool===tool.id?"bg-slate-100 text-[#526B83]":"text-slate-500"}`}>
                            <i className={`bi ${tool.icon} text-[14px] shrink-0`}/><span className="truncate">{tool.title}</span>
                        </button>
                    ))}
                </div>
                <div className="flex gap-3 items-start">
                    <aside className={`hidden lg:block shrink-0 transition-[width] duration-200 ${menuOpen?"w-[230px]":"w-[52px]"}`}>
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <div className={`h-10 flex items-center border-b border-slate-200 ${menuOpen?"justify-between px-3":"justify-center"}`}>
                                {menuOpen&&<span className="text-[12px] font-medium text-slate-500">Инструменты</span>}
                                <button type="button" onClick={()=>setMenuOpen(prev=>!prev)} title={menuOpen?"Свернуть меню":"Развернуть меню"} className="w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100"><i className={`bi ${menuOpen?"bi-chevron-left":"bi-chevron-right"}`}/></button>
                            </div>
                            {TOOLS.map(tool=>{
                                const active=activeTool===tool.id;
                                return <button key={tool.id} type="button" title={tool.title} aria-pressed={active} onClick={()=>setActiveTool(tool.id)} className={`relative w-full flex items-center transition ${menuOpen?"gap-3 px-3 py-3 text-left":"justify-center h-12"} ${active?"bg-slate-100 text-[#526B83]":"text-slate-500 hover:bg-slate-50"}`}>
                                    {active&&<span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-[#526B83]"/>}
                                    <i className={`bi ${tool.icon} text-[17px] shrink-0`}/>
                                    {menuOpen&&<span className="min-w-0"><span className="block text-[13px] font-medium">{tool.title}</span><span className="block text-[11px] text-slate-400">{tool.description}</span></span>}
                                </button>;
                            })}
                        </div>
                    </aside>
                    <section className="flex-1 min-w-0">
                        {activeTool==="beforeAfter"&&<BeforeAfter />}
                        {activeTool==="logs"&&<LogsUser />}
                        {activeTool==="history"&&<History />}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Tools;
