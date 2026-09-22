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
            <div className="px-[2vw] pb-6 mb-10">
                {Object.entries(grouped).map(([date, groupFiles]) => (
                    <div key={date}>
                        {/* Заголовок даты */}
                        <div className="w-full mt-[30px] mb-[10px] pt-[15px] border-t border-[#ddd] text-xs font-normal text-yellow-950 mx-[10px]">
                            {date !== 'Без даты'
                                ? new Date(groupFiles[0].createdAt).toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    weekday: 'long',
                                })
                                : 'Без даты'}
                        </div>

                        {/* Сетка карточек */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-[10px]">
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