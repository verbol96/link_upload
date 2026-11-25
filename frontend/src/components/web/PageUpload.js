import { ProgressBar } from 'react-bootstrap';

export const PageUpload = ({ current, amountPhoto, uploadError }) => {
    const hasError = Boolean(uploadError);

    const percent = amountPhoto > 0
        ? Math.min(100, Math.round((current / amountPhoto) * 100))
        : 0;

    return (
        <div className="flex-1 w-full flex items-center justify-center px-2 py-6 md:px-4 md:py-16">
            <div className="w-full max-w-[560px] bg-white rounded-2xl
                            border border-slate-200
                            shadow-[0_8px_30px_-12px_rgba(51,65,85,0.18)]
                            px-5 py-8 md:px-10 md:py-11">

                {/* Иконка */}
                <div className="flex justify-center mb-5">
                    <div className="relative w-16 h-16">
                        <span className={`absolute inset-0 rounded-full ${
                            hasError
                                ? 'bg-red-100'
                                : 'bg-[#274C77]/10 animate-pulse'
                        }`} />

                        <span className={`absolute inset-2 rounded-full ${
                            hasError
                                ? 'bg-red-200/50'
                                : 'bg-[#274C77]/15'
                        }`} />

                        <span className="absolute inset-0 flex items-center justify-center">
                            <i className={`bi text-[27px] ${
                                hasError
                                    ? 'bi-cloud-slash text-red-500'
                                    : 'bi-cloud-arrow-up text-[#274C77]'
                            }`} />
                        </span>
                    </div>
                </div>

                {/* Заголовок */}
                <div className="text-center">
                    <h4 className={`text-[19px] md:text-[21px] font-semibold leading-tight ${
                        hasError ? 'text-red-600' : 'text-slate-800'
                    }`}>
                        {hasError
                            ? 'Загрузка прервана'
                            : 'Пожалуйста, подождите'}
                    </h4>

                    <div className="mt-1.5 text-[14px] md:text-[15px] text-slate-500">
                        {hasError
                            ? uploadError
                            : 'Идёт загрузка фотографий...'}
                    </div>
                </div>

                {/* Прогресс */}
                <div className="mt-7">
                    <div className="relative h-7 rounded-full overflow-hidden bg-slate-100">
                        <ProgressBar
                            animated={!hasError}
                            now={percent}
                            className={`absolute inset-0 h-full rounded-full overflow-hidden bg-transparent ${
                                hasError
                                    ? '[&_.progress-bar]:bg-red-500'
                                    : '[&_.progress-bar]:bg-gradient-to-r [&_.progress-bar]:from-[#1E3A5D] [&_.progress-bar]:to-[#376A9D]'
                            }`}
                        />

                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/85
                                            text-[12px] font-semibold text-slate-800
                                            shadow-sm backdrop-blur-[1px]">
                                Загружено: {current} из {amountPhoto}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Процент */}
                <div className="text-center mt-3">
                    <span className="text-[30px] md:text-[34px] font-bold text-slate-800 tabular-nums">
                        {percent}
                    </span>

                    <span className="text-[17px] text-slate-400 ml-0.5">
                        %
                    </span>
                </div>

                {/* Подсказки */}
                <div className="mt-7 pt-5 border-t border-dashed border-slate-200 flex flex-col gap-3">
                    {hasError ? (
                        <div className="flex items-start gap-3">
                            <span className="shrink-0 w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                                <i className="bi bi-exclamation-lg text-red-500 text-[11px]" />
                            </span>

                            <div className="pt-0.5">

                                <div className="mt-1 text-[12px] md:text-[13px] text-slate-500 leading-relaxed">
                                    Проверьте интернет-соединение. Попробуйте загрузить заново.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start gap-3">
                                <span className="shrink-0 w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                                    <i className="bi bi-exclamation-lg text-red-500 text-[11px]" />
                                </span>

                                <div className="pt-0.5">
                                    <div className="text-[13px] md:text-[14px] font-semibold text-slate-800">
                                        Не закрывайте и не обновляйте страницу
                                    </div>

                                    <div className="mt-0.5 text-[12px] md:text-[13px] text-slate-500 leading-snug">
                                        Дождитесь окончания загрузки фотографий
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                                    <i className="bi bi-wifi text-slate-500 text-[11px]" />
                                </span>

                                <div className="pt-1 text-[12px] md:text-[13px] text-slate-500 leading-snug">
                                    Скорость загрузки зависит от скорости вашего интернета
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};