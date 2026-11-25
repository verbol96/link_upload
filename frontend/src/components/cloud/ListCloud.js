import { useSelector } from "react-redux";
import { ListRow } from "./ListRow";
import _ from 'lodash';
import { DownloadPanel } from "./DownloadPanel";

export const ListCloud = () => {
    const files = _.orderBy(useSelector(state => state.files.files), 'createdAt', 'desc');

    // Группируем файлы по дате
    const grouped = files.reduce((acc, el) => {
        const date = el.createdAt
            ? new Date(el.createdAt).toLocaleDateString('ru-RU')
            : 'Без даты';
        if (!acc[date]) acc[date] = [];
        acc[date].push(el);
        return acc;
    }, {});

    return (
        <>
            <div className="w-full min-w-0 mb-10 pb-6">
                {Object.entries(grouped).map(([date, groupFiles]) => (
                    <div key={date} className="mt-5">
                        {/* Минималистичный разделитель дня */}
                        <div className="mb-3 flex items-center gap-3">
                            <span className="shrink-0 text-xs font-medium text-[#64748B]">
                                {date !== 'Без даты'
                                    ? new Date(groupFiles[0].createdAt).toLocaleDateString('ru-RU', {
                                        day: 'numeric',
                                        month: 'long',
                                        weekday: 'long',
                                    })
                                    : 'Без даты'}
                            </span>
                            <div className="h-px min-w-0 flex-1 bg-[#E2E8F0]" />
                            <span className="shrink-0 text-[11px] tabular-nums text-[#94A3B8]">
                                {groupFiles.length} шт.
                            </span>
                        </div>

                        {/* Сетка карточек */}
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
                            {groupFiles.map(el => (
                                <ListRow key={el.id} el={el} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <DownloadPanel />
        </>
    );
};
