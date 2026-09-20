import { ProgressBar } from 'react-bootstrap';

export const PageUpload = ({ current, amountPhoto }) => {
    const percent = amountPhoto > 0 ? Math.round((current / amountPhoto) * 100) : 0;

    return (
        <div className="flex-1 w-full flex items-center justify-center px-4 py-10 md:py-20">
            <div className="w-[90%] md:w-[80%] max-w-2xl bg-white rounded-2xl
                            border border-stone-200
                            shadow-[0_10px_40px_-10px_rgba(44,53,49,0.15)]
                            px-[6vw] py-[8vw] md:px-12 md:py-14">

                {/* === Анимированная иконка сверху === */}
                <div className="flex justify-center mb-6">
                    <div className="relative w-20 h-20">
                        {/* Пульсирующие круги */}
                        <span className="absolute inset-0 rounded-full bg-[#0D9488]/20 animate-ping" />
                        <span className="absolute inset-2 rounded-full bg-[#0D9488]/30 animate-pulse" />

                        {/* Иконка в центре */}
                        <span className="absolute inset-0 flex items-center justify-center">
                            <i className="bi bi-cloud-arrow-up text-[#2C3531] text-3xl" />
                        </span>
                    </div>
                </div>

                {/* === Заголовок === */}
                <h5 className="text-[16px] md:text-[20px] font-semibold text-[#2C3531]
                            text-center leading-snug mb-6">
                    Пожалуйста, подождите.<br />
                    <span className="font-normal text-stone-500 text-[14px] md:text-[16px]">
                        Идёт загрузка фотографий...
                    </span>
                </h5>

                {/* === Прогресс-бар === */}
                <div className="mb-2">
                    <ProgressBar
                        animated
                        now={percent}
                        label={`Загружено фото: ${current} из ${amountPhoto}`}
                        className="h-7 rounded-full overflow-hidden
                                [&_.progress-bar]:bg-gradient-to-r [&_.progress-bar]:from-[#2C3531] [&_.progress-bar]:to-[#0D9488]
                                [&_.progress-bar]:text-white [&_.progress-bar]:text-[12px] [&_.progress-bar]:font-medium"
                    />
                </div>

                {/* === Процент === */}
                <div className="text-center mb-8">
                    <span className="text-[28px] md:text-[34px] font-bold text-[#2C3531] tabular-nums">
                        {percent}
                    </span>
                    <span className="text-[18px] text-stone-400 ml-0.5">%</span>
                </div>

                {/* === Подсказки === */}
                <div className="flex flex-col gap-2 pt-6 border-t border-dashed border-stone-200">
                    <div className="flex items-start gap-2.5 text-[12px] md:text-[13px]">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-red-50
                                        flex items-center justify-center mt-px">
                            <i className="bi bi-exclamation text-red-500 text-[10px]" />
                        </span>
                        <span className="text-stone-600 leading-snug">
                            <b className="text-stone-800">Не закрывайте и не обновляйте</b> страницу
                            до окончания загрузки
                        </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-[12px] md:text-[13px]">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-stone-100
                                        flex items-center justify-center mt-px">
                            <i className="bi bi-wifi text-stone-500 text-[10px]" />
                        </span>
                        <span className="text-stone-600 leading-snug">
                            Скорость загрузки зависит от скорости вашего интернета
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};