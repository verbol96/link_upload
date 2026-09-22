import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { ListCloud } from "../components/cloud/ListCloud"
import { deleteFile, getFiles, getFilesAll } from '../http/cloudApi'
import { setFiles, setCurrentDir, setFilesAll, delStack, deleteFileStore } from '../store/fileReducer'
import Footer from "../components/admin/Footer";
import { NavBar } from "../components/admin/NavBar"


const Cloud = () => {
    const dispatch = useDispatch()
    const currentDir = useSelector(state => state.files.currentDir)
    const stackDir = useSelector(state => state.files.stackDir)
    const stack = useSelector(state => state.files.stack)
    const filesAll = useSelector(state => state.files.filesAll)
    const files = useSelector(state => state.files.files)

    useEffect(() => {
        async function getFile() {
            let value = await getFiles(currentDir)
            dispatch(setFiles(value))
        }
        getFile()
    }, [currentDir, dispatch])

    useEffect(() => {
        async function getFileAll() {
            let value1 = await getFilesAll()
            dispatch(setFilesAll(value1))
        }
        getFileAll()
    }, [dispatch])

    const BackClick = () => {
        const backDir = stackDir.pop()
        dispatch(setCurrentDir(backDir))
        dispatch(delStack())
    }

    const getTotalSize = (files) => files.reduce((total, file) => total + file.size, 0) / (1024 * 1024 * 1024);

    const isDateOlderThan14Days = (dateString) => {
        const currentDate = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(currentDate.getDate() - 14);
        const date = new Date(dateString);
        return date < thirtyDaysAgo;
    }

    const deleteFileClick = async (el) => {
        await deleteFile(el.id)
        dispatch(deleteFileStore(el.id))
    }

    useEffect(() => {
        const ClearCloud = async () => {
            if (files.length > 0) {
                const oldFiles = files.filter(el => isDateOlderThan14Days(el.createdAt));
                if (oldFiles.length > 0) {
                    for (const el of oldFiles) {
                        try {
                            await deleteFileClick(el);
                        } catch (error) {
                            console.error(`Ошибка при удалении файла ${el.name}:`, error);
                        }
                    }
                }
            }
        };

        ClearCloud();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col bg-white min-h-screen">
            <NavBar />

            <div className="flex items-center gap-3 mt-4 mx-6 ">

                {/* Кнопка "Назад" */}
                <button
                    className={`
                        shrink-0 w-9 h-9
                        bg-white border border-stone-300 rounded-lg
                        flex items-center justify-center
                        text-stone-600
                        transition-colors
                        ${currentDir
                            ? 'hover:bg-stone-50 hover:border-stone-400 cursor-pointer'
                            : 'opacity-40 cursor-not-allowed'}
                    `}
                    onClick={currentDir ? BackClick : undefined}
                    disabled={!currentDir}
                    title="Назад"
                >
                    <i className="bi bi-arrow-left"></i>
                </button>

                {/* Хлебные крошки */}
                <div className="flex items-center gap-1 min-w-0 text-[13px]">
                    <button
                        className={`shrink-0 transition-colors ${
                            currentDir
                                ? 'text-stone-500 hover:text-teal-800 cursor-pointer'
                                : 'text-stone-800 font-semibold'
                        }`}
                        onClick={currentDir ? () => {
                            // Возврат в корень — можно очистить стек
                            // Если у тебя есть функция "вернуться в корень" — используй её
                        } : undefined}
                    >
                        Все файлы
                    </button>

                    {stack.map((el, index) => {
                        const isLast = index === stack.length - 1;
                        return (
                            <span key={index} className="inline-flex items-center gap-1 min-w-0">
                                <i className="bi bi-chevron-right text-[10px] text-stone-400 shrink-0"></i>
                                <span
                                    className={`truncate ${
                                        isLast
                                            ? 'text-stone-800 font-semibold'
                                            : 'text-stone-500'
                                    }`}
                                    title={el}
                                >
                                    {el}
                                </span>
                            </span>
                        );
                    })}

                    {/* Бейдж с количеством файлов */}
                    <span className="ml-1 shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-600 text-[11px] font-medium rounded-full">
                        <i className="bi bi-files text-[10px]"></i>
                        {files.length} {files.length === 1 ? 'файл' : files.length < 5 ? 'файла' : 'файлов'}
                    </span>
                </div>

                {/* Память — справа, с прогресс-баром. Скрыта на мобилке */}
                <div className="hidden md:flex ml-auto shrink-0 items-center gap-2">
                    <span className="text-[11px] text-stone-500 whitespace-nowrap">
                        Память
                    </span>
                    <div className="w-24 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-teal-700 rounded-full transition-all duration-300"
                            style={{
                                width: `${Math.min(100, (getTotalSize(filesAll) / 60) * 100)}%`,
                            }}
                        />
                    </div>
                    <span className="text-[11px] text-stone-600 tabular-nums font-medium whitespace-nowrap">
                        {getTotalSize(filesAll).toFixed(2)} / 60 ГБ
                    </span>
                </div>
            </div>

            <ListCloud />

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>

        </div>
    )
}

export default Cloud