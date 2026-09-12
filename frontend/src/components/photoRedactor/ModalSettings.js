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

    const saveFormat = async (index) => {
        const item = settingsDB[index];
        try {
            await $host.put(`/api/settings/saveFormat`, item);
            
            setActiveEdit(null);
        } catch (e) {
            alert('Ошибка при сохранении');
        }
    };

    const deleteFormat = async (index) => {
        const item = settingsDB[index];
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
        if (!newFormat.name || !newFormat.width || !newFormat.height) return;
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
        <div className="flex-1 overflow-auto pb-10">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-center">
                    <thead>
                        <tr className="border-b">
                            {COLS.map(c => (
                                <th key={c.key} className="py-2 px-2 font-light text-gray-600 whitespace-nowrap">
                                    {c.label}
                                </th>
                            ))}
                            {/* отдельная колонка для isShow */}
                            <th className="py-2 px-1 font-light text-gray-600 whitespace-nowrap">
                                В списке
                            </th>
                            <th className="py-2 px-2" />
                        </tr>
                    </thead>
                   <tbody>
                        {settingsDB.map((item, index) =>
                            activeEdit === index ? (
                                <tr key={index} className="border-b bg-gray-500">
                                    {COLS.map(({ key, wide }) => (
                                        <td key={key} className={wide ? 'min-w-[160px] px-1' : 'w-16 px-1'}>
                                            <input
                                                type={key === 'name' ? 'text' : 'number'}
                                                step="0.1"
                                                value={item[key] ?? ''}
                                                onChange={e => handleEdit(index, key, e.target.value)}
                                                className="w-full px-2 py-0.5 border rounded text-sm"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-2">
                                        <input
                                            type="checkbox"
                                            checked={!!item.isShow}
                                            onChange={e => handleEdit(index, 'isShow', e.target.checked)}
                                            className="w-4 h-4 accent-blue-600"
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <div className="flex gap-1 justify-center">
                                            <button
                                                onClick={() => saveFormat(index)}
                                                title="Сохранить"
                                                className="px-2 py-0.5 bg-blue-600 rounded hover:bg-blue-800 transition-colors"
                                            >
                                                <i className="bi bi-floppy text-white" />
                                            </button>
                                            <button
                                                onClick={() => deleteFormat(index)}
                                                title="Удалить"
                                                className="px-2 py-0.5 bg-red-400 rounded hover:bg-red-700 transition-colors"
                                            >
                                                <i className="bi bi-trash text-white" />
                                            </button>
                                            <button
                                                onClick={() => setActiveEdit(null)}
                                                title="Отмена"
                                                className="px-2 py-0.5 bg-gray-400 rounded hover:bg-gray-600 transition-colors"
                                            >
                                                <i className="bi bi-x text-white" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={index} className={`border-b hover:bg-gray-50 font-light ${!item.isShow ? 'opacity-50' : ''}`}>
                                    {COLS.map(({ key, wide }) => (
                                        <td key={key} className={`px-1 py-1 ${wide ? 'text-left' : ''}`}>
                                            {item[key] ?? '—'}
                                        </td>
                                    ))}
                                    <td className="px-2 py-1">
                                        {item.isShow
                                            ? <span className="text-green-600"><i className="bi bi-eye" /></span>
                                            : <span className="text-gray-400"><i className="bi bi-eye-slash" /></span>
                                        }
                                    </td>
                                    <td className="px-2 py-1">
                                        <button
                                            onClick={() => setActiveEdit(index)}
                                            title="Редактировать"
                                            className="px-2 py-0.5 bg-gray-400 rounded hover:bg-gray-700 transition-colors"
                                        >
                                            <i className="bi bi-pencil text-white" />
                                        </button>
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {/* Добавление нового формата */}
            <div className=" pt-4 mt-4">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Новый формат</p>
                <div className="flex flex-wrap gap-2 items-end">
                    {[
                        { key: 'name',       label: 'Название',  type: 'text',   cls: 'flex-1 min-w-[120px]' },
                        { key: 'width',      label: 'Ширина',    type: 'number', cls: 'w-20' },
                        { key: 'height',     label: 'Высота',    type: 'number', cls: 'w-20' },
                        { key: 'top',        label: 'Верх',      type: 'number', cls: 'w-16' },
                        { key: 'bottom',     label: 'Низ',       type: 'number', cls: 'w-16' },
                        { key: 'left',       label: 'Лево',      type: 'number', cls: 'w-16' },
                        { key: 'right',      label: 'Право',     type: 'number', cls: 'w-16' },
                        { key: 'widthList',  label: 'Ш. листа',  type: 'number', cls: 'w-20' },
                        { key: 'heightList', label: 'В. листа',  type: 'number', cls: 'w-20' },
                    ].map(({ key, label, type, cls }) => (
                        <div key={key} className={cls}>
                            <label className="text-xs text-gray-500 block mb-1">{label}</label>
                            <input
                                type={type}
                                step="0.1"
                                value={newFormat[key]}
                                onChange={e => setNewFormat(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={key === 'name' ? '10x15' : '0'}
                                className="w-full px-3 py-2 border rounded text-sm"
                            />
                        </div>
                    ))}

                    {/* чекбокс isShow при добавлении */}
                    <div className="flex flex-col items-center gap-1">
                        <label className="text-xs text-gray-500">В списке</label>
                        <input
                            type="checkbox"
                            checked={newFormat.isShow}
                            onChange={e => setNewFormat(prev => ({ ...prev, isShow: e.target.checked }))}
                            className="w-5 h-5 accent-blue-600"
                        />
                    </div>

                    <button
                        onClick={addNewFormat}
                        disabled={!newFormat.name || !newFormat.width || !newFormat.height}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        + Добавить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalSettings;