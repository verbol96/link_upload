import { getCopyBD, setCopyBD } from "../../http/dbApi";
import { useState } from "react";
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { $host } from "../../http";

// Единый стиль для всех кнопок в блоке
const btnCls = "w-full h-10 flex items-center justify-center gap-2 " +
    "bg-white text-[#2C3531] border border-stone-300 rounded-md " +
    "hover:bg-stone-50 text-[11.5px] font-medium " +
    "transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const OtherSettings = () => {
    const [fileBD, setFileBD] = useState(null);
    const [loading, setLoading] = useState(null);

    const [confirmState, setConfirmState] = useState({
        open: false,
        title: '',
        description: '',
        onConfirm: null,
    });

    const askConfirm = (title, description, onConfirm) => {
        setConfirmState({ open: true, title, description, onConfirm });
    };

    const closeConfirm = () => {
        setConfirmState({ open: false, title: '', description: '', onConfirm: null });
    };

    const runConfirm = async () => {
        const cb = confirmState.onConfirm;
        closeConfirm();
        if (cb) await cb();
    };

    // ==== Действия ====

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            setFileBD(data);
            toast.success('Файл загружен', { description: file.name });
        } catch (err) {
            console.error(err);
            toast.error('Не удалось прочитать файл', { description: 'Проверьте, что это корректный JSON' });
            setFileBD(null);
        }
    };

    const saveDB = async () => {
        setLoading('backup');
        try {
            await getCopyBD();
            toast.success('Копия БД скачана');
        } catch (err) {
            console.error(err);
            toast.error('Ошибка при скачивании копии');
        } finally {
            setLoading(null);
        }
    };

    const ToLowerCase = async () => {
        setLoading('lower');
        try {
            const { data } = await $host.get('api/auth/clientsToLowerCase');
            toast.success(data?.message || 'ФИО обновлены');
        } catch (err) {
            console.error(err);
            toast.error('Ошибка обновления ФИО');
        } finally {
            setLoading(null);
        }
    };

    const UpdateUsers = async () => {
        setLoading('users');
        try {
            await $host.get('/api/auth/updateUsers');
            toast.success('Счётчики обновлены');
        } catch (err) {
            console.error(err);
            toast.error('Ошибка обновления счётчиков');
        } finally {
            setLoading(null);
        }
    };

    const setCopyBDin = async () => {
        if (!fileBD) {
            toast.error('Сначала выберите файл');
            return;
        }

        setLoading('import');
        try {
            await setCopyBD(fileBD);
            toast.success('База данных загружена');
            setFileBD(null);
        } catch (err) {
            console.error(err);
            toast.error('Ошибка загрузки БД');
        } finally {
            setLoading(null);
        }
    };

    const handleImportClick = () => {
        if (!fileBD) {
            toast.error('Сначала выберите файл');
            return;
        }
        askConfirm(
            'Загрузить новую БД?',
            'Текущие данные будут полностью перезаписаны данными из файла. Это действие нельзя отменить.',
            setCopyBDin
        );
    };

    const handleLowerCaseClick = () => {
        askConfirm(
            'Привести ФИО к нижнему регистру?',
            'Изменит регистр во всех записях клиентов.',
            ToLowerCase
        );
    };

    const handleUpdateUsersClick = () => {
        askConfirm(
            'Обновить счётчики?',
            'Пересчитает orderCount и totalOrderSum для всех пользователей.',
            UpdateUsers
        );
    };

    const isLoading = (key) => loading === key;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full max-w-5xl">

                {/* === БЭКАП === */}
                <div className="bg-white border border-stone-200 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                            <i className="bi bi-database text-[13px] text-[#0D9488]" />
                        </span>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                            Бэкап
                        </div>
                    </div>

                    <p className="text-[12.5px] text-stone-500 mb-4 leading-snug">
                        Скачать снимок всей базы данных в JSON-файл.
                    </p>

                    <Button
                        onClick={saveDB}
                        disabled={isLoading('backup')}
                        className={btnCls + " mt-auto"}
                    >
                        {isLoading('backup') ? (
                            <>
                                <i className="bi bi-arrow-repeat animate-spin text-[14px]" />
                                Скачивание...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-database-fill-down text-[14px] text-[#0D9488]" />
                                Скачать копию
                            </>
                        )}
                    </Button>
                </div>

                {/* === ИМПОРТ === */}
                <div className="bg-white border border-stone-200 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                            <i className="bi bi-upload text-[13px] text-[#0D9488]" />
                        </span>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                            Импорт БД
                        </div>
                    </div>

                    <p className="text-[12.5px] text-stone-500 mb-4 leading-snug">
                        Заменить текущие данные данными из JSON-файла.
                    </p>

                    <div className="mt-auto flex flex-col gap-2">

                        {/* Зона выбора файла */}
                        <label
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer
                                    border border-dashed rounded-md transition-colors
                                    ${fileBD
                                        ? 'border-[#0D9488]/50 bg-[#0D9488]/5 hover:bg-[#0D9488]/10'
                                        : 'border-stone-300 bg-stone-50 hover:bg-stone-100'
                                    }`}
                        >
                            <span
                                className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center
                                        ${fileBD ? 'bg-[#0D9488]/15' : 'bg-stone-200'}`}
                            >
                                <i
                                    className={`bi text-[13px]
                                            ${fileBD ? 'bi-file-earmark-check text-[#0D9488]' : 'bi-file-earmark-arrow-up text-stone-500'}`}
                                />
                            </span>

                            <div className="flex-1 min-w-0">
                                {fileBD ? (
                                    <>
                                        <div className="text-[12px] font-medium text-stone-800 truncate">
                                            Файл загружен
                                        </div>
                                        <div className="text-[10.5px] text-stone-500 truncate">
                                            Нажмите, чтобы заменить
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-[11.5px] font-medium text-stone-700">
                                            Выберите JSON-файл
                                        </div>
                                        <div className="text-[10.5px] text-stone-400">
                                            или перетащите
                                        </div>
                                    </>
                                )}
                            </div>

                            <i className="bi bi-chevron-right text-[12px] text-stone-400 shrink-0" />

                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {/* Кнопка загрузки — теперь как все */}
                        <Button
                            onClick={handleImportClick}
                            disabled={isLoading('import')}  
                            className={btnCls}
                        >
                            {isLoading('import') ? (
                                <>
                                    <i className="bi bi-arrow-repeat animate-spin text-[14px]" />
                                    Загрузка...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-database-add text-[14px] text-[#0D9488]" />
                                    Загрузить в БД
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* === ОБНОВЛЕНИЯ === */}
                <div className="bg-white border border-stone-200 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                            <i className="bi bi-tools text-[13px] text-[#0D9488]" />
                        </span>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                            Обновления
                        </div>
                    </div>

                    <p className="text-[12.5px] text-stone-500 mb-4 leading-snug">
                        Массовые операции над данными клиентов.
                    </p>

                    <div className="mt-auto flex flex-col gap-2">
                        <Button
                            onClick={handleLowerCaseClick}
                            disabled={isLoading('lower')}
                            className={btnCls}
                        >
                            {isLoading('lower') ? (
                                <>
                                    <i className="bi bi-arrow-repeat animate-spin text-[14px]" />
                                    Обработка...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-type text-[14px] text-[#0D9488]" />
                                    ФИО в нижний регистр
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleUpdateUsersClick}
                            disabled={isLoading('users')}
                            className={btnCls}
                        >
                            {isLoading('users') ? (
                                <>
                                    <i className="bi bi-arrow-repeat animate-spin text-[14px]" />
                                    Обновление...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-calculator text-[14px] text-[#0D9488]" />
                                    Пересчитать статистику
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* === ДИАЛОГ ПОДТВЕРЖДЕНИЯ === */}
            <Dialog
                open={confirmState.open}
                onOpenChange={(open) => !open && closeConfirm()}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[16px] font-semibold text-stone-900">
                            {confirmState.title}
                        </DialogTitle>
                        <DialogDescription className="text-[13px] text-stone-500 leading-snug pt-1">
                            {confirmState.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end gap-2 mt-5">
                        <button
                            onClick={closeConfirm}
                            className="px-4 py-2 rounded-md text-[13px] font-medium
                                    text-stone-700 hover:bg-stone-100 transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={runConfirm}
                            className="px-4 py-2 rounded-md text-[13px] font-medium
                                    bg-[#2C3531] text-white hover:bg-[#3A4540] transition-colors"
                        >
                            Подтвердить
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default OtherSettings;