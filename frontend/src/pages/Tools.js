import { useState } from "react";
import Footer from "../components/admin/Footer";
import { NavBar } from "../components/admin/NavBar";
import BeforeAfter from "../components/tools/BeforeAfter";
import LogsUser from "../components/tools/LogsUser";
import History from "../components/tools/History";

const TOOLS=[
    {id:"beforeAfter",title:"До / После",description:"Наглядное сравнение исходного и обработанного изображения",icon:"bi-images"},
    {id:"logs",title:"Логи",description:"История действий и устройств пользователей",icon:"bi-list-ul"},
    {id:"history",title:"История",description:"История обновлений сайта",icon:"bi-clock-history"}
];

const Tools=()=>{
    const[activeTool,setActiveTool]=useState("logs");
    const[menuOpen,setMenuOpen]=useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-[#f3f6f5]">
            <NavBar />
            <main className="flex-1 w-[94%] max-w-7xl mx-auto py-5 md:py-8">
                <div className="lg:hidden mb-3 flex gap-1.5 overflow-x-auto">
                    {TOOLS.map(tool=>{
                        const active=activeTool===tool.id;
                        return <button key={tool.id} type="button" onClick={()=>setActiveTool(tool.id)} className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-medium transition ${active?"bg-[#eaf4f2] border-[#19766d]/20 text-[#19766d]":"bg-white border-slate-200 text-slate-600"}`}><i className={`bi ${tool.icon} text-[14px]`}/>{tool.title}</button>;
                    })}
                </div>

                <div className="flex gap-4 items-start">
                    <aside className={`hidden lg:block shrink-0 transition-[width] duration-200 ${menuOpen?"w-[270px]":"w-[56px]"}`}>
                        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                            <div className={`h-[42px] flex items-center border-b border-slate-200/80 bg-slate-50 ${menuOpen?"justify-between px-3.5":"justify-center"}`}>
                                {menuOpen&&<span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Инструменты</span>}
                                <button type="button" onClick={()=>setMenuOpen(prev=>!prev)} title={menuOpen?"Свернуть меню":"Развернуть меню"} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-[#19766d] hover:bg-white transition"><i className={`bi ${menuOpen?"bi-chevron-left":"bi-chevron-right"} text-[12px]`}/></button>
                            </div>

                            {TOOLS.map(tool=>{
                                const active=activeTool===tool.id;
                                return <button key={tool.id} type="button" title={!menuOpen?tool.title:undefined} onClick={()=>setActiveTool(tool.id)} className={`relative w-full flex items-center border-b border-slate-100 last:border-b-0 transition ${menuOpen?"gap-3 px-3.5 py-3 text-left":"justify-center h-[52px]"} ${active?"bg-[#19766d]/5":"hover:bg-slate-50"}`}>
                                    {active&&<span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r bg-[#19766d]"/>}
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active?"bg-[#eaf4f2] text-[#19766d]":"bg-slate-100 text-slate-500"}`}><i className={`bi ${tool.icon} text-[14px]`}/></span>
                                    {menuOpen&&<span className="min-w-0 flex-1"><span className={`block text-[13px] font-semibold ${active?"text-[#19766d]":"text-slate-700"}`}>{tool.title}</span><span className="block mt-0.5 text-[10.5px] leading-[1.35] text-slate-400">{tool.description}</span></span>}
                                    {menuOpen&&active&&<span className="w-1.5 h-1.5 rounded-full bg-[#19766d] shrink-0"/>}
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
            <Footer />
        </div>
    );
};

export default Tools;