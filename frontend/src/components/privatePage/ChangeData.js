import { useState, useEffect, useRef, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserAdress } from '../../http/dbApi';
import { setUser } from '../../store/privatePageReducer';

const formatPhoneDisplay = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('375')) {
        const code = digits.slice(3, 5);
        const part1 = digits.slice(5, 8);
        const part2 = digits.slice(8, 10);
        const part3 = digits.slice(10, 12);
        return `+375 (${code}) ${part1}-${part2}-${part3}`;
    }
    return phone;
};

const normalizeUserFields = (u) => ({
    FIO: (u?.FIO ?? '').trim(),
    typePost: u?.typePost || 'E',
    city: (u?.city ?? '').trim(),
    adress: (u?.adress ?? '').trim(),
    postCode: (u?.postCode ?? '').trim(),
});

const inputClass =
    "w-full px-3 py-1.5 bg-gray-50/50 border-[1px] border-gray-100 rounded-lg " +
    "text-base text-gray-800 placeholder-gray-400 " +
    "focus:outline-none focus:ring-2 focus:ring-teal-900/50 " +
    "focus:border-teal-600 focus:bg-white transition-all";

const Field = memo(function Field({ icon, label, isChanged, children }) {
    return (
        <div className="px-4 md:px-5 py-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
                <div className="shrink-0 self-stretch flex items-center border-r pr-4">
                    <i className={`bi ${icon} text-gray-400 text-lg`}></i>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-0.5">
                        {label}
                        {isChanged && (
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                        )}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
});

export const ChangeData = () => {
    const user = useSelector((state) => state.private.user);
    const dispatch = useDispatch();

    const [baseline, setBaseline] = useState(() => normalizeUserFields(user));

    const [FIO, setFIO] = useState(user?.FIO || '');
    const [typePost, setTypePost] = useState(user?.typePost || 'E');
    const [city, setCity] = useState(user?.city || '');
    const [adress, setAdress] = useState(user?.adress || '');
    const [postCode, setPostCode] = useState(user?.postCode || '');

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const lastSyncedUserIdRef = useRef(null);

    useEffect(() => {
        if (!user || !user.id) return;
        if (lastSyncedUserIdRef.current === user.id) return;

        lastSyncedUserIdRef.current = user.id;
        const n = normalizeUserFields(user);
        setBaseline(n);
        setFIO(n.FIO);
        setTypePost(n.typePost);
        setCity(n.city);
        setAdress(n.adress);
        setPostCode(n.postCode);
        setError('');
        setSuccess(false);
    }, [user]);

    const isDirty =
        FIO !== baseline.FIO ||
        typePost !== baseline.typePost ||
        city !== baseline.city ||
        adress !== baseline.adress ||
        postCode !== baseline.postCode;

    const handleSave = async () => {
        if (!isDirty || isSaving || !user?.id) return;
        setIsSaving(true);
        setError('');
        setSuccess(false);

        try {
            // Бэк теперь возвращает полного юзера — используем его напрямую.
            const fresh = await updateUserAdress(user.id, {
                FIO, typePost, city, adress, postCode,
            });

            // Защита: если по какой-то причине пришло не то — не трогаем стор.
            if (!fresh || typeof fresh !== 'object' || !fresh.id) {
                console.warn('[ChangeData] updateUserAdress вернул не юзера:', fresh);
                // Всё равно фиксируем baseline, чтобы точки погасли:
                const n = normalizeUserFields({ FIO, typePost, city, adress, postCode });
                setBaseline(n);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 2500);
                setIsSaving(false);
                return;
            }

            dispatch(setUser(fresh));

            const n = normalizeUserFields(fresh);
            setBaseline(n);
            setFIO(n.FIO);
            setTypePost(n.typePost);
            setCity(n.city);
            setAdress(n.adress);
            setPostCode(n.postCode);

            try {
                const el = document?.activeElement;
                if (el && typeof el.blur === 'function') el.blur();
            } catch (_) { /* ignore */ }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 2500);
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            setError('Не удалось сохранить. Попробуйте ещё раз.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFIO(baseline.FIO);
        setTypePost(baseline.typePost);
        setCity(baseline.city);
        setAdress(baseline.adress);
        setPostCode(baseline.postCode);
        setError('');
    };

    const onChangeFIO = (e) => setFIO(e.target.value);
    const onChangeTypePost = (e) => setTypePost(e.target.value);
    const onChangeCity = (e) => setCity(e.target.value);
    const onChangeAdress = (e) => setAdress(e.target.value);
    const onChangePostCode = (e) => setPostCode(e.target.value);

    return (
        <div className="w-full max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden md:w-full max-w-[100%]">

            <div className="px-4 md:px-5 py-3 bg-teal-900/10">
                <div className="flex items-start gap-2 text-xs font-light text-teal-900">
                    <i className="bi bi-info-circle text-teal-900 mt-0.5 shrink-0"></i>
                    <span>Для автозаполнения данных заказа</span>
                </div>
            </div>

            <Field icon="bi-telephone" label="Телефон">
                <div className="text-base font-semibold text-gray-800 tracking-wide py-1">
                    {formatPhoneDisplay(user?.phone)}
                </div>
            </Field>

            <Field icon="bi-person" label="ФИО" isChanged={FIO !== baseline.FIO}>
                <input
                    spellCheck="false"
                    autoComplete="name"
                    placeholder="Введите ФИО"
                    value={FIO}
                    onChange={onChangeFIO}
                    className={inputClass}
                />
            </Field>

            <Field icon="bi-truck" label="Тип отправки" isChanged={typePost !== baseline.typePost}>
                <div className="relative">
                    {/* Визуальный слой */}
                    <div className={`${inputClass} flex items-center justify-between pr-9 cursor-pointer`}>
                        <span>{typePost === 'E' ? 'Европочта' : 'Белпочта'}</span>
                    </div>

                    {/* Иконка-шеврон справа, поверх визуального слоя */}
                    <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm"></i>

                    {/* Нативный селект — прозрачный, лежит поверх, ловит клики */}
                    <select
                        value={typePost}
                        onChange={onChangeTypePost}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                        <option value="E">Европочта</option>
                        <option value="R">Белпочта</option>
                    </select>
                </div>
            </Field>

            {typePost === 'E' && (
                <>
                    <Field icon="bi-building" label="Город" isChanged={city !== baseline.city}>
                        <input
                            spellCheck="false"
                            autoComplete="address-level2"
                            placeholder="Город"
                            value={city}
                            onChange={onChangeCity}
                            className={inputClass}
                        />
                    </Field>

                    <Field icon="bi-geo-alt" label="Отделение" isChanged={adress !== baseline.adress}>
                        <input
                            spellCheck="false"
                            placeholder="Номер отделения"
                            value={adress}
                            onChange={onChangeAdress}
                            className={inputClass}
                        />
                    </Field>
                </>
            )}

            {typePost === 'R' && (
                <>
                    <Field icon="bi-hash" label="Индекс" isChanged={postCode !== baseline.postCode}>
                        <input
                            spellCheck="false"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            placeholder="Почтовый индекс"
                            value={postCode}
                            onChange={onChangePostCode}
                            className={inputClass}
                        />
                    </Field>

                    <Field icon="bi-building" label="Город" isChanged={city !== baseline.city}>
                        <input
                            spellCheck="false"
                            autoComplete="address-level2"
                            placeholder="Город"
                            value={city}
                            onChange={onChangeCity}
                            className={inputClass}
                        />
                    </Field>

                    <Field icon="bi-geo-alt" label="Адрес" isChanged={adress !== baseline.adress}>
                        <input
                            spellCheck="false"
                            autoComplete="street-address"
                            placeholder="Улица, дом, квартира"
                            value={adress}
                            onChange={onChangeAdress}
                            className={inputClass}
                        />
                    </Field>
                </>
            )}

            {error && (
                <div className="px-4 md:px-5 py-2 bg-red-50 border-t border-red-100">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-red-700">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        {error}
                    </div>
                </div>
            )}

            {success && (
                <div className="px-4 md:px-5 py-2 bg-green-50 border-t border-green-100">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-green-700">
                        <i className="bi bi-check-circle-fill"></i>
                        Данные сохранены
                    </div>
                </div>
            )}

            <div className="p-3 md:p-4 bg-gray-50 flex items-center gap-2">
                <button
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                    className={`flex-1 px-6 py-2.5 rounded-lg text-sm font-medium
                               flex items-center justify-center gap-2 
                               transition-all
                               ${isDirty && !isSaving
                                   ? 'bg-teal-700 hover:bg-teal-900 text-white shadow-sm'
                                   : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                               }`}
                >
                    {isSaving ? (
                        <>
                            <i className="bi bi-arrow-repeat animate-spin"></i>
                            Сохранение...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-check2"></i>
                            Сохранить
                        </>
                    )}
                </button>

                <button
                    onClick={handleCancel}
                    disabled={!isDirty || isSaving}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium
                               transition-colors
                               ${isDirty && !isSaving
                                   ? 'text-gray-500 hover:bg-gray-200'
                                   : 'text-gray-300 cursor-not-allowed'
                               }`}
                >
                    Отменить
                </button>
            </div>
        </div>
    );
};