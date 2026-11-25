import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { ListCloud } from "../components/cloud/ListCloud"
import AdminDrafts from "../components/cloud/AdminDrafts"
import { deleteFile, getFiles, getFilesAll } from "../http/cloudApi"
import { getAdminDrafts } from "../http/adminDraftsApi"
import {
    setFiles,
    setCurrentDir,
    setFilesAll,
    delStack,
    popStackDir,
    resetNavigation,
    deleteFileStore
} from "../store/fileReducer"
import { NavBar } from "../components/admin/NavBar"

const Cloud = () => {
    const dispatch = useDispatch()
    const currentDir = useSelector(state => state.files.currentDir)
    const stackDir = useSelector(state => state.files.stackDir)
    const stack = useSelector(state => state.files.stack)
    const filesAll = useSelector(state => state.files.filesAll)
    const files = useSelector(state => state.files.files)

    const [filesLoaded, setFilesLoaded] = useState(false)
    const [showDrafts, setShowDrafts] = useState(false)
    const [draftCount, setDraftCount] = useState(null)

    const loadDraftCount = useCallback(async () => {
        try {
            const drafts = await getAdminDrafts()
            setDraftCount(drafts.length)
        } catch (error) {
            console.error("Ошибка получения черновиков:", error)
            setDraftCount(null)
        }
    }, [])

    useEffect(() => {
        loadDraftCount()
    }, [loadDraftCount])

    useEffect(() => {
        if (!showDrafts) loadDraftCount()
    }, [showDrafts, loadDraftCount])

    useEffect(() => {
        async function getFile() {
            const value = await getFiles(currentDir)
            dispatch(setFiles(value))
            setFilesLoaded(true)
        }
        getFile()
    }, [currentDir, dispatch])

    useEffect(() => {
        async function getFileAll() {
            const value = await getFilesAll()
            dispatch(setFilesAll(value))
        }
        getFileAll()
    }, [dispatch])

    useEffect(() => {
        const refreshFiles = async () => {
            try {
                const [current, all] = await Promise.all([
                    getFiles(currentDir),
                    getFilesAll()
                ])
                dispatch(setFiles(current))
                dispatch(setFilesAll(all))
            } catch (error) {
                console.error("Ошибка обновления файлов:", error)
            }
        }
        window.addEventListener('link:cloud-files-changed', refreshFiles)
        return () => window.removeEventListener('link:cloud-files-changed', refreshFiles)
    }, [currentDir, dispatch])

    const goToRoot = () => {
        dispatch(resetNavigation())
    }

    const BackClick = () => {
        if (!stackDir.length) {
            dispatch(resetNavigation())
            return
        }
        const backDir = stackDir[stackDir.length - 1]
        dispatch(setCurrentDir(backDir))
        dispatch(popStackDir())
        dispatch(delStack())
    }

    const getTotalSize = files =>
        files.reduce(
            (total, file) => total + (Number(file.size) || 0),
            0
        ) / (1024 * 1024 * 1024)

    const isDateOlderThan14Days = dateString => {
        const currentDate = new Date()
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(currentDate.getDate() - 14)
        const date = new Date(dateString)
        return date < fourteenDaysAgo
    }

    const deleteFileClick = async el => {
        await deleteFile(el.id)
        dispatch(deleteFileStore(el.id))
    }

    useEffect(() => {
        if (!filesLoaded) return

        const ClearCloud = async () => {
            const oldFiles = files.filter(el =>
                isDateOlderThan14Days(el.createdAt)
            )

            for (const el of oldFiles) {
                try {
                    await deleteFileClick(el)
                } catch (error) {
                    console.error(
                        `Ошибка при удалении файла ${el.name}:`,
                        error
                    )
                }
            }
        }

        ClearCloud()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filesLoaded])

    return (
        <div className="flex min-h-screen flex-col bg-[#FAFBFD] text-[#334155]">
            <NavBar />

            {showDrafts ? (
                <AdminDrafts
                    onExit={() => setShowDrafts(false)}
                    onDraftsChanged={loadDraftCount}
                />
            ) : (
                <div className="mx-auto w-[90%] min-w-0">
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm"
                        style={{ border: "1.5px solid #bfcbd7" }}>
                        <button
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] transition-colors ${currentDir
                                ? 'cursor-pointer hover:border-[#274C77] hover:bg-[#F8FAFC] hover:text-[#274C77]'
                                : 'cursor-not-allowed opacity-40'}`}
                            onClick={currentDir ? BackClick : undefined}
                            disabled={!currentDir}
                            title="Назад"
                        >
                            <i className="bi bi-arrow-left" />
                        </button>

                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-[13px]">
                            <button
                                className={`shrink-0 transition-colors ${currentDir
                                    ? 'cursor-pointer text-[#64748B] hover:text-[#274C77]'
                                    : 'font-semibold text-[#334155]'}`}
                                onClick={currentDir ? goToRoot : undefined}
                            >
                                Все файлы
                            </button>

                            {stack.map((el, index) => {
                                const isLast = index === stack.length - 1

                                return (
                                    <span key={index} className="inline-flex min-w-0 items-center gap-1">
                                        <i className="bi bi-chevron-right shrink-0 text-[10px] text-[#94A3B8]" />
                                        <span
                                            className={`truncate ${isLast
                                                ? 'font-semibold text-[#334155]'
                                                : 'text-[#64748B]'}`}
                                            title={el}
                                        >
                                            {el}
                                        </span>
                                    </span>
                                )
                            })}

                            {currentDir == null && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#F8FAFC] px-2 py-1 text-[11px] text-[#64748B]">
                                    <i className="bi bi-folder2 text-[11px]" />
                                    Новых файлов: {files.filter(file => !file.isDownload).length}
                                </span>
                            )}
                        </div>

                        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
                            <span className="whitespace-nowrap text-[11px] text-[#64748B]">Память</span>
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#E2E8F0]">
                                <div
                                    className="h-full rounded-full bg-[#274C77] transition-all duration-300"
                                    style={{ width: `${Math.min(100, (getTotalSize(filesAll) / 60) * 100)}%` }}
                                />
                            </div>
                            <span className="whitespace-nowrap text-[11px] font-medium tabular-nums text-[#334155]">
                                {getTotalSize(filesAll).toFixed(2)} / 60 ГБ
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowDrafts(true)}
                            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md ring-1 ring-inset ring-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-normal text-[#475569] transition-colors hover:ring-[#7890A8]"
                            title="Просмотреть черновики клиентов"
                        >
                            <i className="bi bi-folder2-open text-[14px]" />
                            <span>Черновики ({draftCount === null ? '—' : draftCount})</span>
                        </button>
                    </div>

                    <ListCloud />
                </div>
            )}
        </div>
    )
}

export default Cloud
