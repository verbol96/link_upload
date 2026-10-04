import { ProgressBar } from 'react-bootstrap';

export const PageUpload = ({ current, amountPhoto }) => {
    const percent = amountPhoto > 0 ? Math.min(100, Math.round((current / amountPhoto) * 100)) : 0;

    return (
        <div className="flex-1 w-full flex items-center justify-center px-2 py-6 md:px-4 md:py-16">
            <div className="w-full max-w-[560px] bg-white rounded-2xl
                            border border-stone-200
                            shadow-[0_8px_30px_-12px_rgba(44,53,49,0.18)]
                            px-5 py-8 md:px-10 md:py-11">

                {/* ===== Иконка ===== */}
                <div className="flex justify-center mb-5">
                    <div className="relative w-16 h-16 md:w-18 md:h-18">
                        <span className="absolute inset-0 rounded-full bg-[#19766d]/10 animate-pulse" />
                        <span className="absolute inset-2 rounded-full bg-[#19766d]/15" />
                        <span className="absolute inset-0 flex items-center justify-center">
                            <i className="bi bi-cloud-arrow-up text-[#19766d] text-[27px]" />
                        </span>
                    </div>
                </div>

                {/* ===== Заголовок ===== */}
                <div className="text-center">
                    <h4 className="text-[19px] md:text-[21px] font-semibold text-[#2C3531] leading-tight">
                        Пожалуйста, подождите
                    </h4>
                    <div className="mt-1.5 text-[14px] md:text-[15px] text-stone-500">
                        Идёт загрузка фотографий...
                    </div>
                </div>

                {/* ===== Прогресс ===== */}
                <div className="mt-7">
                    <div className="relative h-7 rounded-full overflow-hidden bg-stone-100">
                        <ProgressBar
                            animated
                            now={percent}
                            className="absolute inset-0 h-full rounded-full overflow-hidden bg-transparent
                                    [&_.progress-bar]:bg-gradient-to-r
                                    [&_.progress-bar]:from-[#2C3531]
                                    [&_.progress-bar]:to-[#19766d]"
                        />
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/85
                                            text-[12px] font-semibold text-[#2C3531]
                                            shadow-sm backdrop-blur-[1px]">
                                Загружено: {current} из {amountPhoto}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ===== Процент ===== */}
                <div className="text-center mt-3">
                    <span className="text-[30px] md:text-[34px] font-bold text-[#2C3531] tabular-nums">
                        {percent}
                    </span>
                    <span className="text-[17px] text-stone-400 ml-0.5">
                        %
                    </span>
                </div>

                {/* ===== Подсказки ===== */}
                <div className="mt-7 pt-5 border-t border-dashed border-stone-200 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-red-50
                                        flex items-center justify-center">
                            <i className="bi bi-exclamation-lg text-red-500 text-[11px]" />
                        </span>

                        <div className="pt-0.5">
                            <div className="text-[13px] md:text-[14px] font-semibold text-stone-800">
                                Не закрывайте и не обновляйте страницу
                            </div>
                            <div className="mt-0.5 text-[12px] md:text-[13px] text-stone-500 leading-snug">
                                Дождитесь окончания загрузки фотографий
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-stone-100
                                        flex items-center justify-center">
                            <i className="bi bi-wifi text-stone-500 text-[11px]" />
                        </span>

                        <div className="pt-1 text-[12px] md:text-[13px] text-stone-500 leading-snug">
                            Скорость загрузки зависит от скорости вашего интернета
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};