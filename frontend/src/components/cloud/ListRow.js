import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteFile, displayFileImg } from '../../http/cloudApi';
import { deleteFileStore, pushStack, setCurrentDir, addStack } from '../../store/fileReducer';
import { addDownload } from '../../store/downloadsReducer';
import style from './ListRow.module.css';

export const ListRow = ({ el }) => {
    const dispatch = useDispatch();
    const currentDir = useSelector(state => state.files.currentDir);
    const [thumb, setThumb] = useState('');

    useEffect(() => {
        const displayFile = async (fileId) => {
            try {
                const data = await displayFileImg(fileId);
                setThumb(data);
            } catch (error) {
                console.error('Error fetching the image:', error);
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

    // ← УПРОЩЕНО: просто добавляем в очередь, всё остальное — глобально
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

    const ShowData = () => {
        const time = el.createdAt.split('T')[1];
        return `${time.split(':')[0]}:${time.split(':')[1]}`;
    };

    return (
        <div className={style.blockFile} onClick={el.type === 'dir' ? () => openFile() : null}>
            <div className={style.fileName} style={{ color: el.isDownload ? 'lightgray' : 'darkgreen' }}>
                <div>{el.name}</div>
                {el.type === 'dir' && <div>{ShowData()}</div>}
            </div>

            <div className={style.imageContainer}>
                {el.type === 'dir' ? (
                    <div className={style.iconMenu}>
                        <span className="bi bi-folder" style={{ color: el.isDownload ? 'lightgray' : 'darkgreen' }}></span>
                    </div>
                ) : (
                    <>
                        {thumb
                            ? <img className={style.imageFull} src={thumb} alt="Loaded from server" />
                            : <p>загрузка</p>
                        }
                    </>
                )}
            </div>

            <div className={style.buttonGroup1}>
                <button className={style.buttonSize} onClick={downloadFile}>
                    <i className="bi bi-cloud-arrow-up"></i>{' '}
                    {el.type === 'dir'
                        ? (calculateFolderSize(el) / 1024 / 1024).toFixed(2)
                        : (el.size / 1024 / 1024).toFixed(2)
                    }мб
                </button>
                <button className={style.buttonDelete} onClick={deleteFileClick}>
                    <i className="bi bi-x-lg"></i>
                </button>
            </div>
        </div>
    );
};