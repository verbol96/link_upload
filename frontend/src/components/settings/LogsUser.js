import { useEffect, useState } from "react";
import { getLogUser } from "../../http/authApi";
import _ from 'lodash';

const formatDate = (iso) => {
    if (!iso) return { date: '—', time: '—' };
    const [d, t] = iso.split('T');
    if (!d) return { date: '—', time: '—' };
    const [y, m, day] = d.split('-');
    const [hh = '00', mm = '00'] = (t || '').split(':');
    return {
        date: `${day}.${m}.${y}`,
        time: `${hh}:${mm}`,
    };
};

const isMobile = (screen) => {
    if (!screen || typeof screen !== 'string') return false;
    const [w, h] = screen.split('x').map(Number);
    if (!w || !h) return false;
    return w < h;
};

export const LogsUser = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getData = async () => {
            try {
                const data = await getLogUser();
                setLogs(_.orderBy(_.orderBy(data), 'createdAt', 'desc'));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        getData();
    }, []);

    return (
        <div className="w-full ">

            {/* === ТАБЛИЦА ЛОГОВ === */}
            <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">

                {/* Заголовок */}
                <div className="flex items-center justify-between px-4 py-2.5
                                bg-stone-50 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                            <i className="bi bi-list-ul text-[11px] text-[#0D9488]" />
                        </span>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                            Логи пользователей
                        </div>
                    </div>
                    <div className="text-[11px] text-stone-400">
                        {logs.length} записей
                    </div>
                </div>

                {/* Загрузка */}
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-stone-400 text-[13px]">
                        <i className="bi bi-arrow-repeat animate-spin" />
                        Загрузка...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="py-12 text-center text-stone-400 text-[13px]">
                        <i className="bi bi-inbox text-[24px] block mb-2 opacity-50" />
                        Пока нет записей
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12.5px]">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-wider font-semibold text-stone-500
                                            border-b border-stone-200">
                                    <th className="text-left px-4 py-2 w-[110px]">Время</th>
                                    <th className="text-left px-4 py-2 w-[100px]">Дата</th>
                                    <th className="text-left px-4 py-2">Устройство</th>
                                    <th className="text-left px-4 py-2">ОС</th>
                                    <th className="text-left px-4 py-2">Браузер</th>
                                    <th className="text-right px-4 py-2 w-[110px]">Экран</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {logs.map((el, index) => {
                                    const { date, time } = formatDate(el.createdAt);
                                    const mobile = isMobile(el.screen);

                                    return (
                                        <tr
                                            key={index}
                                            className="hover:bg-stone-50/60 transition-colors"
                                        >
                                            {/* Время */}
                                            <td className="px-4 py-2 text-stone-500 tabular-nums">
                                                {time}
                                            </td>

                                            {/* Дата */}
                                            <td className="px-4 py-2 text-stone-500 tabular-nums">
                                                {date}
                                            </td>

                                            {/* Устройство + мобильный бейдж */}
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-stone-800">
                                                        {el.device || '—'}
                                                    </span>
                                                    {mobile && (
                                                        <span className="shrink-0 inline-flex items-center gap-1
                                                                        text-[10px] uppercase tracking-wider font-medium
                                                                        px-1.5 py-0.5 rounded
                                                                        bg-teal-50 text-teal-700">
                                                            <i className="bi bi-phone text-[10px]" />
                                                            мобильный
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* ОС */}
                                            <td className="px-4 py-2 text-stone-600">
                                                {el.OS || '—'}
                                            </td>

                                            {/* Браузер */}
                                            <td className="px-4 py-2 text-stone-600">
                                                {el.browser || '—'}
                                            </td>

                                            {/* Экран */}
                                            <td className="px-4 py-2 text-right text-stone-500 tabular-nums">
                                                {el.screen || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogsUser;