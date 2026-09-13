import { useState } from "react";
import { $host } from "../../http";

const COLS = [
    { key: 'name',       label: 'Название',   wide: true },
    { key: 'width',      label: 'Ширина' },
    { key: 'height',     label: 'Высота' },
    { key: 'top',        label: 'Верх' },
    { key: 'bottom',     label: 'Низ' },
    { key: 'left',       label: 'Лево' },
    { key: 'right',      label: 'Право' },
    { key: 'widthList',  label: 'Ш. листа' },
    { key: 'heightList', label: 'В. листа' },
];

const ModalSettings = ({ settingsDB, setSettingsDB, setIsModalOpen }) => {

    const [newFormat, setNewFormat] = useState({
        name: '', width: '', height: '',
        top: '', bottom: '', left: '', right: '',
        widthList: '', heightList: '',
        isShow: true
    });

    const [activeEdit, setActiveEdit] = useState(null);

    const handleEdit = (index, field, value) => {
        setSettingsDB(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const isInvalid = (item) => {
        if (!item.name || !String(item.name).trim()) return 'Укажите название';
        if (!item.width || Number(item.width) <= 0) return 'Ширина должна быть > 0';
        if (!item.height || Number(item.height) <= 0) return 'Высота должна быть > 0';
        if (!item.widthList || Number(item.widthList) <= 0) return 'Ширина листа должна быть > 0';
        if (!item.heightList || Number(item.heightList) <= 0) return 'Высота листа должна быть > 0';

        const dup = settingsDB.filter((s, i) =>
            i !== activeEdit &&
            String(s.name).toLowerCase().trim() === String(item.name).toLowerCase().trim()
        );
        if (dup.length > 0) return 'Такое название уже есть';

        return null;
    };

    const saveFormat = async (index) => {
        const item = settingsDB[index];
        const error = isInvalid(item);

        if (error) {
            alert(error);
            return;
        }

        try {
            await $host.put(`/api/settings/saveFormat`, item);
            setActiveEdit(null);
        } catch (e) {
            alert('Ошибка при сохранении');
        }
    };

    const deleteFormat = async (index) => {
        const item = settingsDB[index];
        console.log(item)
        if (!window.confirm(`Удалить формат "${item.name}"?`)) return;
        try {
            await $host.delete(`/api/settings/deleteFormat/${item.id}`);
            setSettingsDB(prev => prev.filter((_, i) => i !== index));
            setActiveEdit(null);
        } catch (e) {
            alert('Ошибка при удалении');
        }
    };

    const addNewFormat = async () => {
        if (!newFormat.name || !newFormat.width || !newFormat.height) {
            alert('Заполните название, ширину и высоту');
            return;
        }
        if (Number(newFormat.width) <= 0 || Number(newFormat.height) <= 0) {
            alert('Ширина и высота должны быть больше 0');
            return;
        }
        if (!newFormat.widthList || Number(newFormat.widthList) <= 0) {
            alert('Ширина листа должна быть больше 0');
            return;
        }
        if (!newFormat.heightList || Number(newFormat.heightList) <= 0) {
            alert('Высота листа должна быть больше 0');
            return;
        }

        const dup = settingsDB.find(s =>
            String(s.name).toLowerCase().trim() === String(newFormat.name).toLowerCase().trim()
        );
        if (dup) {
            alert('Такое название уже есть');
            return;
        }
        

        try {
            const { data } = await $host.put('/api/settings/saveFormat', newFormat);
            setSettingsDB(prev => [...prev, data]);
            setNewFormat({
                name: '', width: '', height: '',
                top: '', bottom: '', left: '', right: '',
                widthList: '', heightList: '',
                isShow: true
            });
        } catch (e) {
            alert('Ошибка при добавлении');
        }
    };

    return (
        <div className="flex flex-col flex-1 overflow-auto">

            <div className="rounded-md border border-gray-50 px-3 overflow-x-auto">
                <table className="w-full text-sm text-center">
                    <thead className="sticky top-0 bg-white z-10 ">
                        <tr className=" ">
                            {COLS.map(c => (
                                <th key={c.key} className="py-3 px-2 font-medium text-teal-900  whitespace-nowrap text-xs uppercase tracking-wide bg-white">
                                    {c.label}
                                </th>
                            ))}
                            <th className="py-3 px-2 font-medium text-gray-600 whitespace-nowrap text-xs uppercase tracking-wide bg-white">
                                В списке
                            </th>
                            <th className="py-3 px-2 w-28 bg-white" />
                        </tr>
                    </thead>
                    <tbody>
                        {settingsDB.map((item, index) =>
                            activeEdit === index ? (
                                <tr key={index} className="border border-gray-200 bg-gray-200 rounded-md">
                                    {COLS.map(({ key, wide }) => (
                                        <td key={key} className={wide ? 'min-w-[160px] px-1 py-1' : 'w-16 px-1 py-1'}>
                                            <input
                                                type={key === 'name' ? 'text' : 'number'}
                                                step="0.1"
                                                value={item[key] ?? ''}
                                                onChange={e => handleEdit(index, key, e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm 
                                                           focus:outline-none focus:border-teal-500 transition-colors"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-2 py-1">
                                        <input
                                            type="checkbox"
                                            checked={!!item.isShow}
                                            onChange={e => handleEdit(index, 'isShow', e.target.checked)}
                                            className="w-4 h-4 accent-teal-700 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <div className="flex gap-1 justify-center">
                                            <button
                                                onClick={() => saveFormat(index)}
                                                title="Сохранить"
                                                className="px-2 py-1 bg-teal-700 rounded hover:bg-teal-900 transition-colors"
                                            >
                                                <i className="bi bi-floppy text-white text-xs" />
                                            </button>
                                            <button
                                                onClick={() => deleteFormat(index)}
                                                title="Удалить"
                                                className="px-2 py-1 bg-red-400 rounded hover:bg-red-700 transition-colors"
                                            >
                                                <i className="bi bi-trash text-white text-xs" />
                                            </button>
                                            <button
                                                onClick={() => setActiveEdit(null)}
                                                title="Отмена"
                                                className="px-2 py-1 bg-gray-400 rounded hover:bg-gray-600 transition-colors"
                                            >
                                                <i className="bi bi-x text-white text-xs" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr
                                    key={index}
                                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors font-light ${
                                        !item.isShow ? 'opacity-50' : ''
                                    }`}
                                >
                                    {COLS.map(({ key, wide }) => (
                                        <td key={key} className={`px-2 py-0.5 ${wide ? 'text-left font-xs  text-gray-600' : 'text-gray-600'}`}>
                                            {item[key] ?? '—'}
                                        </td>
                                    ))}
                                    <td className="px-2 py-0.5">
                                        {item.isShow
                                            ? <span className="text-teal-600"><i className="bi bi-eye" /></span>
                                            : <span className="text-gray-400"><i className="bi bi-eye-slash" /></span>
                                        }
                                    </td>
                                    <td className="px-2 py-0.5">
                                        <button
                                            onClick={() => setActiveEdit(index)}
                                            title="Редактировать"
                                            className="px-3 py-1 bg-gray-100 rounded text-gray-700 
                                                       hover:bg-teal-700 hover:text-white transition-colors text-xs"
                                        >
                                            <i className="bi bi-pencil" />
                                        </button>
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {/* Добавление нового формата */}
            <div className="pt-3 mt-1">
                <label className="text-md text-teal-900 mb-2">Добавить новый формат:</label>
                <div className="flex flex-wrap gap-3 items-end">
                    {[
                        { key: 'name',       label: 'Название',  type: 'text',   cls: 'flex-1 min-w-[120px] ' },
                        { key: 'width',      label: 'Ширина',    type: 'number', cls: 'w-24' },
                        { key: 'height',     label: 'Высота',    type: 'number', cls: 'w-24' },
                        { key: 'top',        label: 'Верх',      type: 'number', cls: 'w-20' },
                        { key: 'bottom',     label: 'Низ',       type: 'number', cls: 'w-20' },
                        { key: 'left',       label: 'Лево',      type: 'number', cls: 'w-20' },
                        { key: 'right',      label: 'Право',     type: 'number', cls: 'w-20' },
                        { key: 'widthList',  label: 'Ш. листа',  type: 'number', cls: 'w-24' },
                        { key: 'heightList', label: 'В. листа',  type: 'number', cls: 'w-24' },
                    ].map(({ key, label, type, cls }) => (
                        <div key={key} className={cls}>
                            <label className="text-xs text-gray-500 block mb-1">{label}</label>
                            <input
                                type={type}
                                step="0.1"
                                value={newFormat[key]}
                                onChange={e => setNewFormat(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={key === 'name' ? '10x15' : '0'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm 
                                           focus:outline-none focus:border-teal-500 transition-colors"
                            />
                        </div>
                    ))}

                    <div className="flex flex-col items-center gap-1 pb-1">
                        <label className="text-xs text-gray-500">В списке</label>
                        <input
                            type="checkbox"
                            checked={newFormat.isShow}
                            onChange={e => setNewFormat(prev => ({ ...prev, isShow: e.target.checked }))}
                            className="w-5 h-5 accent-teal-700 cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={addNewFormat}
                        disabled={!newFormat.name || !newFormat.width || !newFormat.height}
                        className="px-5 py-1 bg-teal-700 text-white rounded-lg text-sm font-medium 
                                   hover:bg-teal-900 disabled:opacity-40 disabled:cursor-not-allowed 
                                   transition-colors flex items-center gap-2"
                    >
                        <i className="bi bi-plus-lg"></i>
                        Добавить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalSettings;