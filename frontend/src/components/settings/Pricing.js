import { addSettings, deleteSetting, getSettings } from "../../http/dbApi";
import { useState, useEffect } from "react";
import _ from 'lodash';
import { $host } from "../../http";

// Карта цветов для типов
const TYPE_STYLES = {
    photo:  { bg: 'bg-teal-50',   text: 'text-teal-700',   label: 'фото'    },
    holst:  { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'холст'   },
    magnit: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'магнит'  },
};

const getTypeStyle = (type) =>
    TYPE_STYLES[type] || { bg: 'bg-stone-100', text: 'text-stone-600', label: type };

export const Pricing = () => {
    const [settings, setSettings] = useState([]);

    const [type, setType] = useState('photo');
    const [title, setTitle] = useState('');
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [R, setR] = useState(1);
    const [R1, setR1] = useState(1);
    const [E, setE] = useState(1);
    const [inputR, setInputR] = useState(0);
    const [inputR1, setInputR1] = useState(0);
    const [inputE, setInputE] = useState(0);

    useEffect(() => {
        async function getPriceList() {
            let value = await getSettings();
            setSettings(_.orderBy(value, ['type', 'price']));

            setR(Number(value.find(el => el.title === 'R')?.price) ?? 0);
            setR1(Number(value.find(el => el.title === 'R1')?.price) ?? 0);
            setE(Number(value.find(el => el.title === 'E')?.price) ?? 0);
        }
        getPriceList();
    }, []);

    const AddSetting = async () => {
        if (!title || !name || !price) return;

        await addSettings(type, title, name, price);
        setSettings(_.orderBy(
            [...settings, { type, title, name, price }],
            ['type', 'price']
        ));
        setTitle('');
        setName('');
        setPrice('');
    };

    const DeleteSetting = async (id) => {
        if (!window.confirm("Удалить позицию?")) return;
        await deleteSetting(id);
        setSettings(settings.filter(el => el.id !== id));
    };

    const changePrice = async (title, price) => {
        const { data } = await $host.post('/api/settings/changePriceDel', { title, price });
        if (data === 'ok') {
            setInputR(0);
            setInputR1(0);
            setInputE(0);
        }
    };

    const inputCls =
        "px-2 py-1 text-[12.5px] text-stone-800 bg-white " +
        "border border-stone-200 rounded " +
        "focus:outline-none focus:border-[#0D9488] transition-colors";

    const delivery = [
        { label: 'Белпочта',     value: R,  set: setInputR,  input: inputR,  key: 'R' },
        { label: 'Европочта',    value: E,  set: setInputE,  input: inputE,  key: 'E' },
        { label: 'Первый класс', value: R1, set: setInputR1, input: inputR1, key: 'R1' },
    ];

    const visibleSettings = settings.filter(el => el.type !== 'deliver');

    return (
        <div className="w-full mx-auto px-4 mt-1 pb-8 flex flex-col gap-3">

            {/* === ТАБЛИЦА ФОРМАТОВ === */}
            <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
                <table className="w-full text-[12.5px]">
                    <thead>
                        <tr className="bg-stone-50 border-b border-stone-200
                                    text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                            <th className="text-left px-2 py-1.5 w-[80px]">Тип</th>
                            <th className="text-left px-2 py-1.5">Title</th>
                            <th className="text-left px-2 py-1.5">Name</th>
                            <th className="text-right px-2 py-1.5 w-[70px]">Цена</th>
                            <th className="w-[36px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {visibleSettings.map((el, i) => {
                            const s = getTypeStyle(el.type);
                            return (
                                <tr key={i} className="hover:bg-stone-50/60 transition-colors">
                                    <td className="px-2 py-1">
                                        <span
                                            className={`inline-block text-[10px] uppercase tracking-wider font-medium
                                                    px-1.5 py-0.5 rounded ${s.bg} ${s.text}`}
                                        >
                                            {s.label}
                                        </span>
                                    </td>
                                    <td className="px-2 py-1 truncate max-w-0 text-stone-700">
                                        {el.title}
                                    </td>
                                    <td className="px-2 py-1 truncate max-w-0 text-stone-500">
                                        {el.name}
                                    </td>
                                    <td className="px-2 py-1 text-right font-semibold text-stone-900 whitespace-nowrap">
                                        {el.price} р
                                    </td>
                                    <td className="px-1 py-1 text-center">
                                        <button
                                            onClick={() => DeleteSetting(el.id)}
                                            className="w-6 h-6 rounded inline-flex items-center justify-center
                                                    text-stone-400 hover:text-red-600 hover:bg-red-50
                                                    transition-colors"
                                            title="Удалить"
                                        >
                                            <i className="bi bi-x text-[14px]" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {visibleSettings.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-2 py-4 text-center text-stone-400 text-[12px]">
                                    Пока нет ни одной позиции
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* === ФОРМА ДОБАВЛЕНИЯ — одной строкой === */}
            <div className="w-full flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-md p-1.5">

                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={inputCls + " w-[100px] shrink-0"}
                >
                    <option value="photo">фото</option>
                    <option value="holst">холст</option>
                    <option value="magnit">магнит</option>
                </select>

                <input
                    placeholder="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputCls + " flex-1 min-w-0"}
                />
                <input
                    placeholder="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls + " flex-1 min-w-0"}
                />
                <input
                    placeholder="цена"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={inputCls + " w-[100px] shrink-0"}
                />

                <button
                    onClick={AddSetting}
                    disabled={!title || !name || !price}
                    className="shrink-0 px-3 h-8 text-[12.5px] font-medium
                            bg-[#2C3531] text-white rounded-md
                            hover:bg-[#3A4540] transition-colors
                            disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    + Добавить
                </button>
            </div>

            {/* === ДОСТАВКА === */}
            <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
                <div className="px-3 py-1.5 bg-stone-50 border-b border-stone-200
                                text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                    Доставка
                </div>

                <div className="divide-y divide-stone-100">
                    {delivery.map(({ label, value, set, input, key }) => (
                        <div key={key} className="flex items-center gap-2 px-3 py-1.5">
                            <span className="text-[12.5px] text-stone-700 w-[110px]">{label}</span>
                            <span className="text-[12.5px] font-semibold text-stone-900 w-[50px] text-right">
                                {value} р
                            </span>
                            <input
                                value={input}
                                onChange={(e) => set(e.target.value)}
                                placeholder="новая"
                                className={inputCls + " max-w-[90px] ml-auto"}
                            />
                            <button
                                onClick={() => changePrice(key, input)}
                                disabled={!input || Number(input) === 0}
                                className="shrink-0 px-2.5 py-1 text-[11.5px] font-medium
                                        bg-white text-[#2C3531] border border-stone-300 rounded
                                        hover:bg-stone-50 transition-colors
                                        disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Изменить
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};