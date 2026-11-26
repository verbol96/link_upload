import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { deleteFile, displayFileImg, setFileDownloadStatus } from '../../http/cloudApi';
import { deleteFileStore, pushStack, setCurrentDir, addStack } from '../../store/fileReducer';
import { addDownload } from '../../store/downloadsReducer';

export const ListRow = ({ el }) => {
    const dispatch = useDispatch();
    const currentDir = useSelector(state => state.files.currentDir);
    const files = useSelector(state => state.files.filesAll);
    const [thumb, setThumb] = useState('');
    const [imgLoading, setImgLoading] = useState(el.type !== 'dir');
    const [isDownloaded, setIsDownloaded] = useState(Boolean(el.isDownload));
    const [statusSaving, setStatusSaving] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobilePosition, setMobilePosition] = useState(null);
    const menuRef = useRef(null);
    const popupRef = useRef(null);
    const isFolder = el.type === 'dir';
    useEffect(() => {
        if (!menuOpen) return;
        const closeMenu = event => {
            if (!menuRef.current?.contains(event.target) && !popupRef.current?.contains(event.target)) setMenuOpen(false);
        };
        const closeOnEscape = event => { if (event.key === 'Escape') setMenuOpen(false); };
        const closeOnMove = () => setMenuOpen(false);
        document.addEventListener('pointerdown', closeMenu);
        document.addEventListener('keydown', closeOnEscape);
        window.addEventListener('resize', closeOnMove);
        if (mobilePosition) window.addEventListener('scroll', closeOnMove, true);
        return () => {
            document.removeEventListener('pointerdown', closeMenu);
            document.removeEventListener('keydown', closeOnEscape);
            window.removeEventListener('resize', closeOnMove);
            window.removeEventListener('scroll', closeOnMove, true);
        };
    }, [menuOpen, mobilePosition]);
    useEffect(() => { setIsDownloaded(Boolean(el.isDownload)); }, [el.id, el.isDownload]);
    useEffect(() => {
        const displayFile = async fileId => {
            try { setThumb(await displayFileImg(fileId)); }
            catch (error) { console.error('Error fetching the image:', error); }
            finally { setImgLoading(false); }
        };
        if (el.type !== 'dir') displayFile(el.id);
    }, [el]);
    const openFile = () => {
        dispatch(pushStack(currentDir));
        dispatch(setCurrentDir(el.id));
        dispatch(addStack(el.name));
    };
    const deleteFileClick = async e => {
        e.stopPropagation(); setMenuOpen(false);
        if (window.confirm('Вы уверены, что хотите удалить этот файл?')) {
            await deleteFile(el.id); dispatch(deleteFileStore(el.id)); alert('Файл удален');
        }
    };
    const downloadFile = e => {
        e.stopPropagation();
        dispatch(addDownload({ id: el.id, name: el.name, type: el.type }));
        setIsDownloaded(true);
    };
    const toggleViewed = async e => {
        e.stopPropagation(); setMenuOpen(false);
        if (statusSaving) return;
        const previous = isDownloaded;
        const next = !previous;
        setIsDownloaded(next); setStatusSaving(true);
        try {
            await setFileDownloadStatus(el.id, next);
            window.dispatchEvent(new Event('link:cloud-files-changed'));
        } catch (error) {
            setIsDownloaded(previous); console.error('Ошибка изменения статуса папки:', error); alert('Не удалось изменить статус папки');
        } finally { setStatusSaving(false); }
    };
    const calculateFolderSize = el => {
        const path = el.path ? el.path + '/' + el.name : el.name;
        return files.reduce((acc, file) => file.path.includes(path) ? acc + file.size : acc, 0);
    };
    const formatSize = bytes => {
        if (!bytes) return '0 КБ';
        const kb = bytes / 1024, mb = kb / 1024, gb = mb / 1024;
        if (gb >= 1) return `${gb.toFixed(2)} ГБ`;
        if (mb >= 1) return `${mb.toFixed(1)} МБ`;
        return `${kb.toFixed(0)} КБ`;
    };
    const ShowData = () => {
        const time = el.createdAt.split('T')[1];
        return `${time.split(':')[0]}:${time.split(':')[1]}`;
    };
    const size = isFolder ? calculateFolderSize(el) : el.size;
    const toggleMenu = e => {
        e.stopPropagation();
        if (menuOpen) { setMenuOpen(false); return; }
        if (window.matchMedia('(max-width: 767px)').matches) {
            const rect = e.currentTarget.getBoundingClientRect();
            const width = Math.min(192, window.innerWidth - 16);
            const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
            const below = window.innerHeight - rect.bottom;
            const above = rect.top;
            const openAbove = below < 150 && above > below;
            setMobilePosition({ position: 'fixed', left, width, ...(openAbove ? { bottom: window.innerHeight - rect.top + 4, maxHeight: Math.max(0, above - 12) } : { top: rect.bottom + 4, maxHeight: Math.max(0, below - 12) }) });
        } else setMobilePosition(null);
        setMenuOpen(true);
    };
    const popup = menuOpen && (
        <div ref={popupRef} style={mobilePosition || undefined} className={`${mobilePosition ? 'z-[9999] overflow-y-auto' : 'absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden'} rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-md`} onClick={e => e.stopPropagation()}>
            <div className="border-b border-[#E2E8F0] px-3 py-2 text-[11px] text-[#475569]"><i className="bi bi-clock mr-2" />{ShowData()}</div>
            {isFolder && <button type="button" onClick={toggleViewed} disabled={statusSaving} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[#475569] hover:bg-[#F3F5F7] disabled:opacity-50"><i className={`bi ${isDownloaded ? 'bi-eye' : 'bi-eye-slash'} text-[#64748B]`} />{isDownloaded ? 'Вернуть в новые' : 'Отметить просмотренной'}</button>}
            <button type="button" onClick={deleteFileClick} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[#475569] hover:bg-red-50"><i className="bi bi-trash" />Удалить</button>
        </div>
    );
    return (
        <div className={`group relative aspect-square rounded-xl ring-1 ring-inset transition-all duration-200 select-none hover:shadow-[0_1px_4px_rgba(39,76,119,0.05)] ${isDownloaded ? 'bg-[#FAFBFD] ring-[#E2E8F0]' : 'bg-white ring-[#7890A8] hover:ring-[#647D97]'} ${isFolder ? 'cursor-pointer' : ''}`} onClick={isFolder ? openFile : undefined}>
            <div className={`absolute inset-x-0 top-0 flex h-9 items-center gap-1 px-2 md:px-3 ${menuOpen ? 'z-30' : 'z-20'}`}>
                <span className={`min-w-0 flex-1 truncate text-[12px] font-normal ${isDownloaded ? 'text-[#94A3B8]' : 'text-[#475569]'}`} title={el.name}>{el.name}</span>
                <div ref={menuRef} className="relative shrink-0">
                    <button type="button" onClick={toggleMenu} className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${isDownloaded ? 'text-[#94A3B8] hover:bg-[#F1F3F5]' : menuOpen ? 'bg-[#F1F3F5] text-[#7890A8]' : 'text-[#7890A8] hover:bg-[#F1F3F5]'}`} title="Свойства" aria-label="Свойства" aria-expanded={menuOpen}><i className="bi bi-three-dots text-[15px]" /></button>
                    {menuOpen && (mobilePosition ? createPortal(popup, document.body) : popup)}
                </div>
            </div>
            <div className="absolute inset-x-0 bottom-10 top-9 flex items-center justify-center px-2">
                {isFolder ? <i className={`bi bi-folder text-[32px] md:text-[42px] ${isDownloaded ? 'text-[#B5BEC9]' : 'text-[#7890A8]'}`} /> : imgLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#7890A8]" /> : thumb ? <img className="h-full w-full object-contain" src={thumb} alt={el.name} loading="lazy" /> : <i className="bi bi-image text-2xl text-[#94A3B8]" />}
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 px-1.5 pb-2 md:px-2">
                <button type="button" onClick={downloadFile} className={`flex h-7 w-full items-center justify-center gap-1 whitespace-nowrap rounded-md ring-1 ring-inset text-[10px] md:gap-1.5 md:text-[11px] font-normal transition-colors ${isDownloaded ? 'ring-[#E2E8F0] bg-transparent text-[#94A3B8] hover:bg-white/50' : 'ring-[#7890A8] bg-white text-[#475569] hover:bg-[#F3F6FA]'}`} title="Скачать" aria-label={`Скачать ${el.name}`}>
                    <i className="bi bi-download shrink-0 text-[12px]" /><span className="min-w-0 truncate"><span className="hidden md:inline">Скачать · </span>{formatSize(size)}</span>
                </button>
            </div>
        </div>
    );
};
