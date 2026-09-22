import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteFile, displayFileImg } from '../../http/cloudApi';
import { deleteFileStore, pushStack, setCurrentDir, addStack } from '../../store/fileReducer';
import { addDownload } from '../../store/downloadsReducer';

export const ListRow = ({ el }) => {
    const dispatch = useDispatch();
    const currentDir = useSelector(state => state.files.currentDir);
    const [thumb, setThumb] = useState('');
    const [imgLoading, setImgLoading] = useState(el.type !== 'dir');

    useEffect(() => {
        const displayFile = async (fileId) => {
            try {
                const data = await displayFileImg(fileId);
                setThumb(data);
            } catch (error) {
                console.error('Error fetching the image:', error);
            } finally {
                setImgLoading(false);
            }
        };
        if (el.type !== 'dir') displayFile(el.id);
    }, [el]);

    const openFile = () => {
        dispatch(pushStack(currentDir));
        dispatch(setCurrentDir(el.id));
        dispatch(addStack(el.name));
    };

    const deleteFileClick = async (e) => {
        e.stopPropagation();
        const confirmation = window.confirm('Вы уверены, что хотите удалить этот файл?');
        if (confirmation) {
            await deleteFile(el.id);
            dispatch(deleteFileStore(el.id));
            alert('Файл удален');
        }
    };

    const downloadFile = (e) => {
        e.stopPropagation();
        dispatch(addDownload({
            id: el.id,
            name: el.name,
            type: el.type,
        }));
    };

    const files = useSelector(state => state.files.filesAll);

    const calculateFolderSize = (el) => {
        let path;
        if (el.path) path = el.path + '/' + el.name;
        else path = el.name;
        return files.reduce((acc, file) => {
            return file.path.includes(path) ? acc + file.size : acc;
        }, 0);
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 КБ';
        const kb = bytes / 1024;
        const mb = kb / 1024;
        const gb = mb / 1024;
        if (gb >= 1) return `${gb.toFixed(2)} ГБ`;
        if (mb >= 1) return `${mb.toFixed(1)} МБ`;
        return `${kb.toFixed(0)} КБ`;
    };

    const ShowData = () => {
        const time = el.createdAt.split('T')[1];
        return `${time.split(':')[0]}:${time.split(':')[1]}`;
    };

    const size = el.type === 'dir' ? calculateFolderSize(el) : el.size;
    const isFolder = el.type === 'dir';

    return (
        <div
            className={`
                group relative aspect-square
                bg-gray-400/5 rounded-xl overflow-hidden
                border border-gray-200
                hover:border-gray-500 hover:shadow-md
                transition-all duration-200
                select-none
                ${isFolder ? 'cursor-pointer' : ''}
                ${el.isDownload ? ' bg-white' : ''}
            `}
            onClick={isFolder ? openFile : undefined}
        >
            {/* Имя + время */}
            <div className="h-[28px] px-3 py-1.5 flex items-center justify-between gap-2 text-[12px]">
                <span
                    className="font-light text-yellow-950 truncate flex-1"
                    title={el.name}
                >
                    {el.name}
                </span>
                {isFolder && (
                    <span className="text-[10px] text-yellow-950 shrink-0 tabular-nums">
                        {ShowData()}
                    </span>
                )}
            </div>

            {/* Превью */}
            <div className="w-full h-[calc(100%-58px)] flex items-center justify-center px-2">
                {isFolder ? (
                    <i className={`bi bi-folder-fill text-5xl ${el.isDownload ? ' text-yellow-600/30' : 'text-yellow-600'}`}></i>
                ) : imgLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-teal-700 rounded-full animate-spin"></div>
                ) : thumb ? (
                    <img
                        className="w-full h-full object-contain"
                        src={thumb}
                        alt={el.name}
                        loading="lazy"
                    />
                ) : (
                    <i className="bi bi-image text-2xl text-gray-300"></i>
                )}
            </div>

            {/* Кнопки */}
            <div className="h-[30px] flex items-center gap-1 px-2 pb-2">
                <button
                    onClick={downloadFile}
                    className={`
                        flex-1 h-6 rounded-md
                         text-yellow-950 text-[10px] font-light
                         border-[0.8px] border-bg-gray-900/50
                        flex items-center justify-center gap-1
                        transition-colors
                        ${el.isDownload ? ' bg-gray-300/5 hover:bg-gray-300/10' : 'bg-gray-500/5 hover:bg-gray-500/10'}`}
                    
                    title="Скачать"
                >
                    <i className="bi bi-download text-[10px]"></i>
                    <span className="truncate">{formatSize(size)}</span>
                </button>
                <button
                    onClick={deleteFileClick}
                    className="
                        w-7 h-7 rounded-lg shrink-0
                        text-gray-400 hover:text-red-500 hover:bg-red-50/30
                        flex items-center justify-center
                        transition-colors
                    "
                    title="Удалить"
                >
                    <i className="bi bi-x-lg text-[11px]"></i>
                </button>
            </div>
        </div>
    );
};