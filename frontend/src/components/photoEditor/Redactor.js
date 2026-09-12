import { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import CropperComponent from './Cropper';

const Redactor = () => {
    const [photos, setPhotos] = useState([]);
    const [activePhoto, setActivePhoto] = useState(0);

    const isSwitchingRef = useRef(false);
    const photosRef = useRef([]);

    useEffect(() => {
        photosRef.current = photos;
    }, [photos]);

    const changePhoto = useCallback((index) => {
        if (index < 0 || index >= photos.length) return;

        isSwitchingRef.current = true;
        setActivePhoto(index);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                isSwitchingRef.current = false;
            });
        });
    }, [photos.length]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // ФИКС #8: защита от пустого списка (activePhoto = -1) —
            // иначе ArrowDown при пустом массиве уйдёт в changePhoto(0) с photos[0] = undefined
            if (photos.length === 0) return;

            if (e.key === 'ArrowLeft' && activePhoto > 0) {
                e.preventDefault();
                changePhoto(activePhoto - 1);
            } else if (e.key === 'ArrowRight' && activePhoto < photos.length - 1) {
                e.preventDefault();
                changePhoto(activePhoto + 1);
            } else if (e.key === 'ArrowDown' && activePhoto < photos.length - 1) {
                e.preventDefault();
                changePhoto(activePhoto + 1);
            } else if (e.key === 'ArrowUp' && activePhoto > 0) {
                // ФИКС #9: было `activePhoto < photos.length + 1` (бессмысленно)
                // и changePhoto(activePhoto - 1) без проверки на 0 — при activePhoto=0
                // получалось -1, и срабатывала защита в changePhoto, но лучше явно
                e.preventDefault();
                changePhoto(activePhoto - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePhoto, photos.length, changePhoto]);

    const onSaveCrop = (photoId, newData) => {
        setPhotos(prev => prev.map(photo =>
            photo.id === photoId
                ? {
                    ...photo,
                    cropData: photo.cropData
                        ? { ...photo.cropData, ...newData }
                        : newData
                }
                : photo
        ));
    };

    const handleAddPhotos = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const newPhotos = files.map((file, i) => ({
            id: Date.now() + i,
            url: URL.createObjectURL(file),
            name: file.name,
            cropData: null,
        }));
        setPhotos(prev => [...prev, ...newPhotos]);
        setActivePhoto(0);
        e.target.value = '';
    };



    const savePhotos = async () => {
        const currentPhotos = photosRef.current;

        const unprocessed = currentPhotos
            .map((p, i) => (!p.cropData?.croppedAreaPixels ? i + 1 : null))
            .filter(Boolean);

        if (unprocessed.length) {
            alert(`Фото ${unprocessed.join(', ')} не обработаны`);
            return;
        }

        const zip = new JSZip();

        for (let i = 0; i < currentPhotos.length; i++) {
            const photo = currentPhotos[i];
            const { croppedAreaPixels } = photo.cropData;

            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = photo.url;
            });

            const canvas = document.createElement('canvas');
            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(
                img,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            );

            const blob = await new Promise(resolve =>
                canvas.toBlob(resolve, 'image/jpeg', 0.92)
            );

            const baseName = photo.name.replace(/\.[^.]+$/, '');
            zip.file(`${baseName}.jpg`, blob);
        }

        zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, 'photos.zip');
        });
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#f0f0ee]" style={{ fontFamily: 'system-ui, sans-serif' }}>

            {/* ── Колонка 1: список миниатюр ── */}
            <aside className="w-[140px] shrink-0 flex flex-col border-r border-[#ddddd8] bg-white overflow-y-auto">
                {photos.length === 0 ? (
                    <label className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center cursor-pointer hover:bg-[#f8f8f6] transition">
                        <span className="text-2xl text-[#bbb]">+</span>
                        <span className="text-xs text-[#aaa] leading-snug">Добавьте фото</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleAddPhotos}
                            className="hidden"
                        />
                    </label>
                ) : (
                    <ul className="flex flex-col gap-1.5 p-2">
                        {photos.map((photo, i) => (
                            <li
                                key={photo.id}
                                onClick={() => changePhoto(i)}
                                className={`relative rounded-md overflow-hidden cursor-pointer transition-all outline outline-2 ${
                                    activePhoto === i
                                        ? 'outline-[#2e7d5e]'
                                        : 'outline-transparent hover:outline-[#c8c8c4]'
                                }`}
                            >
                                <img
                                    src={photo.url}
                                    alt={photo.name}
                                    className="w-full aspect-square object-cover"
                                />
                                <span className="absolute bottom-1 left-1 text-[10px] font-semibold text-white bg-black/40 rounded px-1 leading-[16px]">
                                    {i + 1}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>

            {/* ── Колонка 2: кроппер + кнопки ── */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* область кроппера */}
                <div className="flex-1 flex items-center justify-center gap-5 min-h-0 px-6">
                    <NavBtn
                        icon="‹"
                        onClick={() => changePhoto(activePhoto - 1)}
                        disabled={activePhoto === 0 || photos.length === 0}
                    />

                    <CropperComponent 
                        photos={photos}
                        activePhoto={activePhoto}
                        onSaveCrop={onSaveCrop}
                        isSwitchingRef={isSwitchingRef}
                    />

                    <NavBtn
                        icon="›"
                        onClick={() => changePhoto(activePhoto + 1)}
                        disabled={photos.length === 0 || activePhoto === photos.length - 1}
                    />
                </div>

                {/* панель кнопок редактирования */}
                <div
                    className="shrink-0 border-t border-[#ddddd8] bg-white flex items-center justify-center gap-1 px-6"
                    style={{ height: 56 }}
                >
                    <ToolBtn icon="↺" title="Повернуть влево" />
                    <ToolBtn icon="↻" title="Повернуть вправо" />
                    <ToolBtn icon="⇄" title="Сменить ориентацию" />

                    <Divider />

                    <ToolBtn icon="⊡" title="Белые поля" />
                    <ToolBtn icon="▣" title="Рамка" />

                    <Divider />

                    <div className="flex items-center gap-2 px-1">
                        <ToolBtn icon="−" title="Уменьшить" />
                        <input
                            type="range"
                            min={0} max={100} defaultValue={50}
                            className="w-28"
                            style={{ accentColor: '#2e7d5e' }}
                        />
                        <ToolBtn icon="+" title="Увеличить" />
                    </div>
                </div>
            </main>

            {/* ── Колонка 3: настройки ── */}
            <aside
                className="shrink-0 flex flex-col gap-4 border-l border-[#ddddd8] bg-white overflow-y-auto"
                style={{ width: 232, padding: 16 }}
            >
                {/* номер заказа */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#888] flex items-center gap-1">
                        <span className="text-[#aaa]">#</span> Номер заказа
                    </label>
                    <input
                        type="text"
                        placeholder="Введите номер заказа"
                        className="w-full border border-[#d8d8d4] rounded-md px-3 py-2 text-sm bg-white placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e] transition"
                    />
                </div>

                {/* размер */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#888]">Размер</label>
                    <div className="flex gap-2 items-center">
                        <select className="flex-1 border border-[#d8d8d4] rounded-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e] transition">
                            <option>10x15</option>
                            <option>15x20</option>
                            <option>20x30</option>
                        </select>
                        <button className="flex items-center gap-1 text-xs text-[#666] border border-[#d8d8d4] rounded-md px-2.5 py-2 hover:bg-[#f4f4f2] transition whitespace-nowrap">
                            ⚙ настройки
                        </button>
                    </div>
                </div>

                {/* тип кадра */}
                <div className="flex rounded-md overflow-hidden border border-[#d8d8d4] text-xs">
                    <button className="flex-1 py-2 bg-[#2e7d5e] text-white font-medium">
                        только кадр
                    </button>
                    <button className="flex-1 py-2 bg-white text-[#555] hover:bg-[#f4f4f2] transition">
                        кадр с рамкой
                    </button>
                </div>

                {/* spacer */}
                <div className="flex-1" />

                {/* прогресс */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-[#999]">
                        <span>обработано</span>
                        <span>
                            {photos.filter(p => p.cropData).length} / {photos.length}
                        </span>
                    </div>
                    <div className="h-1 rounded-full bg-[#e8e8e4] overflow-hidden">
                        <div
                            className="h-full bg-[#2e7d5e] rounded-full transition-all duration-300"
                            style={{
                                width: photos.length
                                    ? `${(photos.filter(p => p.cropData).length / photos.length) * 100}%`
                                    : '0%'
                            }}
                        />
                    </div>
                </div>

                {/* скачать */}
                <button
                    onClick={savePhotos}
                    className="w-full py-2.5 rounded-lg bg-[#2e7d5e] hover:bg-[#266b51] text-white text-sm font-medium flex items-center justify-center gap-2 transition"
                >
                    ↓ Скачать все
                </button>

                {/* очистить */}
                <button
                    onClick={() => { setPhotos([]); setActivePhoto(0); }}
                    className="w-full py-2 rounded-lg border border-[#d8d8d4] text-[#999] text-sm flex items-center justify-center gap-2 hover:bg-[#fff5f5] hover:text-[#c0392b] hover:border-[#f5c0c0] transition"
                >
                    🗑 Очистить всё
                </button>

                {/* добавить фото */}
                <label className="w-full py-2 rounded-lg border border-dashed border-[#ccc] text-[#999] text-sm flex items-center justify-center gap-1.5 hover:bg-[#f8f8f6] cursor-pointer transition">
                    + Добавить фото
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAddPhotos}
                        className="hidden"
                    />
                </label>
            </aside>
        </div>
    );
};

const NavBtn = ({ icon, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-11 h-11 rounded-full bg-white border border-[#ddddd8] shadow-sm flex items-center justify-center text-xl text-[#555] hover:bg-[#f4f4f2] disabled:opacity-25 disabled:cursor-not-allowed transition shrink-0"
    >
        {icon}
    </button>
);

const ToolBtn = ({ icon, title, active }) => (
    <button
        title={title}
        className={`w-9 h-9 rounded-md flex items-center justify-center text-base transition ${
            active
                ? 'bg-[#2e7d5e]/10 text-[#2e7d5e]'
                : 'text-[#555] hover:bg-[#f0f0ee]'
        }`}
    >
        {icon}
    </button>
);

const Divider = () => (
    <div className="w-px h-5 bg-[#e0e0dc] mx-1 shrink-0" />
);

export default Redactor;
