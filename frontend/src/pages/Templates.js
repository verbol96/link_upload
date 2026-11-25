import { useState } from 'react';
import { NavBar } from '../components/admin/NavBar';
import { templates } from '../components/templates/templates';
import TemplateEditor from '../components/templates/TemplateEditor';

const Templates = () => {
    const [group, setGroup] = useState('photostrip');
    const [selected, setSelected] = useState(null);
    const groups = [
        { id: 'photostrip', name: 'Фотополоски' },
        { id: 'collage', name: 'Коллажи' }
    ];
    const visibleTemplates = templates.filter(item => item.group === group);

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFD]">
            <NavBar />
            <main className="mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-y-auto px-4 py-3">
                {selected ? (
                    <TemplateEditor template={selected} onBack={() => setSelected(null)} />
                ) : (
                    <>
                        <div className="mb-5 mt-4 flex gap-2 overflow-x-auto pb-3">
                            {groups.map(item => (
                                <button
                                    type="button"
                                    key={item.id}
                                    onClick={() => setGroup(item.id)}
                                    aria-pressed={group === item.id}
                                    className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${group === item.id
                                        ? 'border-[#C6D8EB] bg-[#E8F0F8] text-[#274C77]'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#C6D8EB] hover:bg-[#F3F7FB]'
                                    }`}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                        {visibleTemplates.length ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {visibleTemplates.map(item => (
                                    <button
                                        type="button"
                                        key={item.id}
                                        onClick={() => setSelected(item)}
                                        className="rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-[#A9C3DD] hover:bg-[#F8FBFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#274C77]/25"
                                    >
                                        <div className="mb-3 flex h-44 items-center justify-center rounded-lg bg-slate-50">
                                            <div className="flex h-36 w-14 flex-col gap-1.5 bg-white p-1.5 shadow-sm">
                                                {Array.from({ length: item.frames }, (_, index) => (
                                                    <div key={index} className="flex flex-1 items-center justify-center rounded-sm bg-slate-200">
                                                        <i className="bi bi-image text-slate-400" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-slate-800">{item.name}</div>
                                        <div className="mt-1 text-xs text-slate-500">{item.frames} фотографии</div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                                В этой группе пока нет шаблонов
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Templates;
