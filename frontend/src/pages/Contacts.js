
import React, { useState } from 'react';
import { NavBar } from '../components/admin/NavBar';

const Contacts = () => {
    const [showDetails, setShowDetails] = useState(false);

    const contacts = [
        {
            title: 'Instagram - вся актуальная информация о нас тут',
            subtitle: '@link.belarus',
            icon: 'bi-instagram',
            href: 'https://www.instagram.com/link.belarus',
            type: 'instagram',
        },
        {
            title: 'Telegram - сюда можно писать по всем вопросам',
            subtitle: '@link_belarus',
            icon: 'bi-telegram',
            href: 'https://www.t.me/link_belarus',
            type: 'telegram',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <NavBar />

            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* ===== О НАС ===== */}
                <section>
                    <h2 className="text-[13px] font-semibold text-slate-700 mb-3 px-1">
                        О нас
                    </h2>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="p-4 sm:p-4">
                            <div className="border-l-[3px] border-[#274C77] pl-4">

                                {/* История */}
                                <div className="flex items-center gap-2 text-[#274C77] mb-2">
                                    <i className="bi bi-clock-history text-sm" />

                                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                                        Печатаем с 2017 года
                                    </span>
                                </div>

                                <p className="text-[13px] leading-6 text-slate-700">
                                    Прошли путь от
                                    струйного принтера до{' '}
                                    <span className="font-semibold text-slate-800">
                                         химической фотолаборатории
                                    </span>.
                                    {' '}Накопили большой опыт и подобрали оборудование
                                    и материалы для {' '}
                                    <span className="font-semibold text-slate-800">
                                    высокого качества печати
                                    </span>.
                                </p>

                                {/* География работы */}
                                <div className="flex items-center gap-2 mt-4 mb-2 text-[#274C77]">
                                    <i className="bi bi-geo-alt text-sm" />

                                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                                        Работаем по всей Беларуси
                                    </span>
                                </div>

                                <p className="text-[13px] leading-6 text-slate-600">
                                    Наш офис находится в городе Скидель.
                                    Все заказы{' '}
                                    <span className="font-semibold text-slate-800">
                                        принимаем онлайн
                                    </span>, а готовую продукцию{' '}
                                    <span className="font-semibold text-slate-800">
                                        отправляем Белпочтой и Европочтой
                                    </span> по всей стране.
                                </p>

                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== КОНТАКТЫ ===== */}
                <section>
                    <h2 className="text-[13px] font-semibold text-slate-700 mb-3 px-1">
                        Связаться с нами
                    </h2>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                        {contacts.map((contact) => (
                            <a
                                key={contact.title}
                                href={contact.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3.5 p-4
                                           hover:bg-slate-50 active:bg-slate-100
                                           transition-colors"
                            >
                                <div
                                    className={`w-10 h-10 rounded-lg flex items-center
                                                justify-center shrink-0
                                        ${
                                            contact.type === 'instagram'
                                                ? 'bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]'
                                                : 'bg-[#229ED9]'
                                        }`}
                                >
                                    <i
                                        className={`bi ${contact.icon} text-xl text-white`}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-medium text-slate-800">
                                        {contact.title}
                                    </div>

                                    <div className="text-xs text-slate-500 mt-1">
                                        {contact.subtitle}
                                    </div>
                                </div>

                                <i className="bi bi-arrow-up-right text-sm text-slate-400 shrink-0" />
                            </a>
                        ))}
                    </div>
                </section>

                {/* ===== ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ ===== */}
                <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowDetails((prev) => !prev)}
                        aria-expanded={showDetails}
                        className="w-full flex items-center justify-between gap-3 p-4
                                   text-left hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <i className="bi bi-file-earmark-text text-lg text-slate-400" />

                            <span className="text-[13px] font-medium text-slate-700">
                                Юридическая информация
                            </span>
                        </div>

                        <i
                            className={`bi bi-chevron-down text-xs text-slate-400
                                transition-transform duration-200
                                ${showDetails ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {showDetails && (
                        <div className="px-4 pb-5 pt-4 border-t border-slate-100">
                            <dl className="space-y-4 text-xs">

                                <div>
                                    <dt className="text-slate-400 mb-1">
                                        Наименование
                                    </dt>
                                    <dd className="text-slate-700">
                                        Индивидуальный предприниматель
                                        Верболь Виктор Юрьевич
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-slate-400 mb-1">
                                        УНП
                                    </dt>
                                    <dd className="text-slate-700">
                                        591870601
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-slate-400 mb-1">
                                        Дата государственной регистрации
                                    </dt>
                                    <dd className="text-slate-700">
                                        21 мая 2018 года
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-slate-400 mb-1">
                                        Регистрирующий орган
                                    </dt>
                                    <dd className="text-slate-700">
                                        Щучинский районный исполнительный комитет
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-slate-400 mb-1">
                                        Адрес регистрации
                                    </dt>
                                    <dd className="text-slate-700 leading-5">
                                        Республика Беларусь, Гродненская область,
                                        Щучинский район, Дембровский сельсовет,
                                        аг. Демброво, ул. Молодёжная, д. 21
                                    </dd>
                                </div>

                            </dl>
                        </div>
                    )}
                </section>

                {/* ===== КОПИРАЙТ ===== */}
                <div className="text-center text-[11px] text-slate-400 pb-5 pt-1">
                    © LINK {new Date().getFullYear()}
                </div>

            </main>
        </div>
    );
};

export default Contacts;
