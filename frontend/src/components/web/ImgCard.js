import { useEffect, useRef, useState } from "react";
export const ImgCard = ({ image, original, deleteImg }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [originalUrl, setOriginalUrl] = useState(null);
    const menuRef = useRef(null);
    const checkerboard = {
        backgroundColor: '#ffffff',
        backgroundImage: `linear-gradient(45deg, #f7f7f7 25%, transparent 25%),linear-gradient(-45deg, #f7f7f7 25%, transparent 25%),linear-gradient(45deg, transparent 75%, #f7f7f7 75%),linear-gradient(-45deg, transparent 75%, #f7f7f7 75%)`,
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
    };
    useEffect(() => {
        const closeMenu = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", closeMenu);
        return () => document.removeEventListener("mousedown", closeMenu);
    }, []);
    useEffect(() => {
        if (!previewOpen) return;
        const file = original?.file;
        if (!file) {
            setOriginalUrl(image.url);
            return;
        }
        const url = URL.createObjectURL(file);
        setOriginalUrl(url);
        return () => {
            URL.revokeObjectURL(url);
            setOriginalUrl(null);
        };
    }, [previewOpen, original, image.url]);
    useEffect(() => {
        const closePreview = (e) => {
            if (e.key === "Escape") setPreviewOpen(false);
        };
        if (previewOpen) {
            document.addEventListener("keydown", closePreview);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", closePreview);
            document.body.style.overflow = "";
        };
    }, [previewOpen]);
    const handleDelete = () => {
        setMenuOpen(false);
        deleteImg(image.id);
    };
    const handlePreview = () => {
        setMenuOpen(false);
        setPreviewOpen(true);
    };
    const file = original?.file;
    const fileName = file?.name || image?.name || "Без названия";
    const fileSize = file?.size ? `${(file.size / 1024 / 1024).toFixed(2)} МБ` : "—";
    return (
        <>
            <div className="relative aspect-square overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm" style={checkerboard}>
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <img className="absolute inset-0 w-full h-full object-cover" src={image.url} alt="Фото" />
                </div>
                <div ref={menuRef} className="absolute top-1.5 right-1.5 z-20">
                    <button type="button" onClick={() => setMenuOpen(prev => !prev)} aria-label="Действия с фото" aria-expanded={menuOpen} className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-700 active:scale-95 transition">
                        <i className="bi bi-three-dots text-[15px]" />
                    </button>
                    {menuOpen && (
                        <div className="absolute top-9 right-0 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                            <button type="button" onClick={handlePreview} className="w-full px-3 py-2 flex items-center gap-2.5 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                <i className="bi bi-info-circle text-[13px] text-slate-400" />
                                Свойства
                            </button>
                            <div className="h-px bg-slate-100 mx-2" />
                            <button type="button" onClick={handleDelete} className="w-full px-3 py-2 flex items-center gap-2.5 text-left text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors">
                                <i className="bi bi-trash3 text-[13px]" />
                                Удалить
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {previewOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6" onClick={() => setPreviewOpen(false)}>
                    <div className="relative w-[96vw] sm:w-[90vw] md:w-[82vw] h-[85vh] max-w-[1400px] overflow-hidden rounded-xl bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="h-[58px] shrink-0 border-b border-slate-200 px-4 sm:px-5 flex items-center gap-5">
                            <div className="min-w-0 flex-1">
                                <div className="text-[10px] text-slate-400 mb-0.5">Название файла</div>
                                <div className="text-[12.5px] font-medium text-slate-700 truncate" title={fileName}>{fileName}</div>
                            </div>
                            <div className="shrink-0">
                                <div className="text-[10px] text-slate-400 mb-0.5">Размер</div>
                                <div className="text-[12.5px] font-medium text-slate-700">{fileSize}</div>
                            </div>
                            <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Закрыть" className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                                <i className="bi bi-x-lg text-[14px]" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 p-3 bg-slate-100 flex items-center justify-center" style={checkerboard}>
                            {originalUrl && <img src={originalUrl} alt={fileName} className="max-w-full max-h-full object-contain shadow-sm" />}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};