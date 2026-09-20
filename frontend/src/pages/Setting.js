import { useState } from 'react';
import Footer from "../components/admin/Footer";
import OtherSettings from "../components/settings/OtherSettings";
import { Pricing } from "../components/settings/Pricing";
import { NavBar } from '../components/admin/NavBar';
import LogsUser from '../components/settings/LogsUser';

const Setting = () => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { label: 'Настройки цены',   index: 0, icon: 'bi-tag',        hint: 'Прайс и форматы' },
        { label: 'Другие настройки', index: 1, icon: 'bi-sliders',    hint: 'Параметры системы' },
        { label: 'Логи',             index: 2, icon: 'bi-list-ul',    hint: 'История действий' },
    ];

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <NavBar />

            <div className="flex-1 flex min-h-0">

                {/* === ЖЁСТКИЙ ЛЕВЫЙ САЙДБАР (десктоп) === */}
                <aside className="hidden md:flex w-[260px] shrink-0 flex-col
                                bg-white border-r border-stone-200">

                   

                    {/* Пункты меню */}
                    <nav className="flex-1 px-3 flex flex-col gap-1 mt-10">
                        {tabs.map(({ label, index, icon, hint }) => {
                            const active = activeTab === index;
                            return (
                                <button
                                    key={index}
                                    onClick={() => setActiveTab(index)}
                                    className={`group relative flex items-start gap-3 px-3 py-2.5
                                            rounded-lg text-left transition-all
                                            ${active
                                                ? 'bg-gray-400/50 text-gray-900'
                                                : 'text-stone-700 hover:bg-stone-100'
                                            }`}
                                >
                                    {/* Иконка в квадратике */}
                                    <span
                                        className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center mt-0.5
                                                transition-colors
                                                ${active
                                                    ? 'bg-gray-400'
                                                    : 'text-black hover:bg-stone-100'
                                                }`}
                                    >
                                        <i className={`bi ${icon} text-[14px] 
                                                ${active
                                                    ? 'text-gray-100 '
                                                    : 'text-gray-800'
                                                }` } />
                                    </span>

                                    {/* Текст */}
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-[13.5px] font-medium leading-tight ${
                                            active ? 'text-stone-700' : 'text-stone-800'
                                        }`}>
                                            {label}
                                        </div>
                                        <div className={`text-[11px] mt-0.5 leading-tight ${
                                            active ? 'text-stone-600' : 'text-stone-400'
                                        }`}>
                                            {hint}
                                        </div>
                                    </div>

                                    {/* Полоска слева у активного */}
                                    {active && (
                                        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r
                                                        bg-teal-900" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                </aside>

                {/* === МОБИЛЬНОЕ МЕНЮ (горизонтальная полоса) === */}
                <div className="md:hidden w-full">
                    <div className="border-b border-stone-200 bg-white px-3 py-2
                                    flex gap-1.5 overflow-x-auto">
                        {tabs.map(({ label, index, icon }) => {
                            const active = activeTab === index;
                            return (
                                <button
                                    key={index}
                                    onClick={() => setActiveTab(index)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5
                                            text-[12.5px] font-medium rounded-md whitespace-nowrap
                                            transition-colors
                                            ${active
                                                ? 'bg-[#2C3531] text-white'
                                                : 'text-stone-600 hover:bg-stone-100'
                                            }`}
                                >
                                    <i className={`bi ${icon} text-[13px]`} />
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <main className="w-full">
                        <div className="max-w-3xl mx-auto px-4 py-6">
                            {activeTab === 0 && <Pricing />}
                            {activeTab === 1 && <OtherSettings />}
                            {activeTab === 2 && <LogsUser />}
                        </div>
                    </main>
                </div>

                {/* === КОНТЕНТ (десктоп) === */}
                <main className="hidden md:block flex-1 min-w-0 overflow-auto w-full">
                    <div className="mx-auto px-6 py-8">
                        {activeTab === 0 && <Pricing />}
                        {activeTab === 1 && <OtherSettings />}
                        {activeTab === 2 && <LogsUser />}
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default Setting;