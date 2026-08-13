import { useState } from "react";
import { $host } from "../../http";
import { Button } from "react-bootstrap";

const ModalSettings = ({settingsDB, setSettingsDB, setIsModalOpen}) =>{

    const [newFormatName, setNewFormatName] = useState('');
    const [newFormatWidth, setNewFormatWidth] = useState('');
    const [newFormatHeight, setNewFormatHeight] = useState('');

    const [activeEdit, setActiveEdit] = useState()

    const handleEdit = (name, field, value) => {
        setSettingsDB(prev => prev.map(item =>
            item.name === name ? { ...item, [field]: value } : item
        ));
    };

    const saveFormat = (name) =>{

    }



    const addNewFormat = async () => {
        if (!newFormatName || !newFormatWidth || !newFormatHeight) return;
        
        const newFormat = {
            name: newFormatName,
            width: newFormatWidth,
            height: newFormatHeight,
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        };
        
        await $host.post('/api/settings/addFormat', newFormat);
        setSettingsDB(prev => [...prev, newFormat]);
        setNewFormatName('');
        setNewFormatWidth('');
        setNewFormatHeight('');
    };

    const saveAllFormats = async () => {
        await $host.put('/api/settings/saveAllFormats', settingsDB);
        alert('Сохранено');
    };

    return(
        <div className="flex-1 overflow-auto pb-10">

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-center">
                    <thead>
                        <tr>
                            <th className="py-2">Название</th>
                            <th className="py-2">Ширина</th>
                            <th className="py-2">Высота</th>
                            <th className="py-2">Верх</th>
                            <th className="py-2">Низ</th>
                            <th className="py-2">Лево</th>
                            <th className="py-2">Право</th>
                        </tr>
                    </thead>

                    <tbody>
                    {settingsDB.map((item, index) => (
                        (activeEdit === index) ?
                        <tr key={item.name} className="border-b bg-green-50">
                            <td className="max-w-[200px]">
                                <input 
                                value={item.name}
                                onChange={(e) => handleEdit(item.name, 'name', e.target.value)}
                                className="w-full px-2 py-1 border rounded"
                                />
                            </td>
                            <td className="max-w-[50px]">
                                <input 
                                value={item.width}
                                onChange={(e) => handleEdit(item.name, 'width', e.target.value)}
                                className="w-full px-2 py-1 border rounded"
                                />
                            </td>
                            <td className="max-w-[50px]">
                                <input 
                                value={item.height}
                                onChange={(e) => handleEdit(item.name, 'height', e.target.value)}
                                className="w-full px-2 py-1 border rounded"
                                />
                            </td>
                            <td className="max-w-[50px]">
                                <input 
                                value={item.top}
                                onChange={(e) => handleEdit(item.name, 'top', e.target.value)}
                                className="w-full px-2 py-1 border rounded"
                                />
                            </td>
                            <td className="max-w-[50px]">
                                <input 
                                value={item.bottom}
                                onChange={(e) => handleEdit(item.name, 'bottom', e.target.value)}
                                className="w-full px-2 py-1 border rounded"
                                />
                            </td>
                            <td className="max-w-[50px]">
                                <input 
                                value={item.left}
                                onChange={(e) => handleEdit(item.name, 'left', e.target.value)}
                                className="w-full px-2 py-1 border rounded"
                                />
                            </td>
                            <td className="max-w-[50px]">
                                <input 
                                value={item.right}
                                onChange={(e) => handleEdit(item.name, 'right', e.target.value)}
                                className="w-full px-2 py-1 border rounded"
                                />
                            </td>
                            <td className="px-2 text-center flex flex-row gap-1  py-4">
                                <button
                                onClick={() => saveFormat(item.name)}
                                className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-800 transition-colors text-sm"
                                >
                                <i className="bi bi-floppy text-white"></i>
                                </button>
                           
                                <button
                                onClick={() => saveFormat(item.name)}
                                className="px-2 py-1 bg-red-400 rounded hover:bg-red-700 transition-colors text-sm"
                                >
                                <i className="bi bi-trash text-white"></i>
                                </button>
                            
                                <button
                                onClick={() => setActiveEdit()}
                                className="px-2 py-1 bg-gray-500 rounded hover:bg-gray-700 transition-colors text-sm"
                                >
                                <i className="bi bi-x text-white"></i>
                                </button>
                            </td>
                        </tr>
                        :
                        <tr key={item.name} className="border-b hover:bg-gray-50 ">
                            <td className="min-w-[200px] ">{item.name}</td>
                            <td className="">{item.width}</td>
                            <td className="">{item.height}</td>
                            <td className="">{item.top}</td>
                            <td className="">{item.bottom}</td>
                            <td className="">{item.left}</td>
                            <td className="">{item.right}</td>
                            <td className=" px-2 text-center">
                                <button
                                    onClick={() => setActiveEdit(index)}
                                    className="px-2 py-1 bg-gray-400 rounded hover:bg-gray-700 transition-colors text-sm"
                                    >
                                    <i className="bi bi-pencil  text-white"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
                
                {/* Добавление нового формата */}
            <div className="border-t pt-4 mt-2">
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                    <label className="text-xs text-gray-500">Название</label>
                    <input 
                        value={newFormatName}
                        onChange={(e) => setNewFormatName(e.target.value)}
                        placeholder="10x15"
                        className="w-full px-3 py-2 border rounded text-sm"
                    />
                    </div>
                    <div className="w-24">
                    <label className="text-xs text-gray-500">Ширина</label>
                    <input 
                        type="number"
                        value={newFormatWidth}
                        onChange={(e) => setNewFormatWidth(e.target.value)}
                        className="w-full px-3 py-2 border rounded text-sm"
                        step="0.1"
                    />
                    </div>
                    <div className="w-24">
                    <label className="text-xs text-gray-500">Высота</label>
                    <input 
                        type="number"
                        value={newFormatHeight}
                        onChange={(e) => setNewFormatHeight(e.target.value)}
                        className="w-full px-3 py-2 border rounded text-sm"
                        step="0.1"
                    />
                    </div>
                    <button 
                    onClick={addNewFormat}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                    + Добавить
                    </button>
                </div>
                </div>
               
        </div>
    )
}

export default ModalSettings