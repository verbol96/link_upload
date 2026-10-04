import { useState, useEffect, useRef, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserAdress } from '../http/dbApi';
import { setUser } from '../store/privatePageReducer';

import Footer from "../components/admin/Footer";
import { NavBar } from "../components/admin/NavBar";

// ============ ХЕЛПЕРЫ ============
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
    "w-full px-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-lg " +
    "text-base text-gray-800 placeholder-gray-400 " +
    "focus:outline-none focus:ring-2 focus:ring-teal-900/50 " +
    "focus:border-teal-600 focus:bg-white transition-all";

// ============ FIELD ============
const Field = memo(function Field({ icon, label, isChanged, children,last=false }) {
    return (
        <div className={`px-4 md:px-5 py-2 ${last?'':'border-b border-gray-100'}`}>
            <div className="flex items-center gap-3">
                <div className="shrink-0 self-stretch flex items-center border-r border-gray-100 pr-4">
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

// ============ СТРАНИЦА ============
const MyProfile = () => {
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
            const fresh = await updateUserAdress(user.id, {
                FIO, typePost, city, adress, postCode,
            });

            if (!fresh || typeof fresh !== 'object' || !fresh.id) {
                console.warn('[Profile] updateUserAdress вернул не юзера:', fresh);
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
        <div className="flex flex-col min-h-screen bg-gray-50">
            <NavBar />

            <div className="flex-1 w-full max-w-2xl mx-auto px-3 md:px-6 py-4 md:py-6">


                {/* Инфо-плашка */}
                <div className="px-4 md:px-5 py-3 bg-stone-500/5 rounded-md">
                    <div className="flex flex-col items-center gap-2 text-xs font-light text-stone-900">
                        <div className='text-xs font-normal'>
                            <i className="bi bi-info-circle mt-0.5 shrink-0"></i>
                            <span> Для автозаполнения формы</span>
                        </div>
                        <span>(могут отличаться в заказе)</span>
                    </div>
                </div>

                {/* Карточка с формой */}
                <div className="w-full bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden mt-8 py-3">

                  

                    {/* Телефон */}
                    <Field icon="bi-telephone" label="Телефон">
                        <div className="text-base font-semibold text-teal-900 tracking-wide py-1">
                            {formatPhoneDisplay(user?.phone)}
                        </div>
                    </Field>

                    {/* ФИО */}
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

                    {/* Тип отправки */}
                    <Field icon="bi-truck" label="Тип отправки" isChanged={typePost !== baseline.typePost}>
                        <div className="relative">
                            <div className={`${inputClass} flex items-center justify-between pr-9 cursor-pointer`}>
                                <span>{typePost === 'E' ? 'Европочта' : 'Белпочта'}</span>
                            </div>

                            <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm"></i>

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

                    {/* Поля для Европочты */}
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

                            <Field last icon="bi-geo-alt" label="Отделение" isChanged={adress !== baseline.adress}>
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

                    {/* Поля для Белпочты */}
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

                            <Field last icon="bi-geo-alt" label="Адрес" isChanged={adress !== baseline.adress}>
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

                    {/* Ошибка */}
                    {error && (
                        <div className="px-4 md:px-5 py-2 bg-red-50 border-t border-red-100">
                            <div className="flex items-center gap-2 text-xs md:text-sm text-red-700">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Успех */}
                    {success && (
                        <div className="px-4 md:px-5 py-2 bg-green-50 border-t border-green-100">
                            <div className="flex items-center gap-2 text-xs md:text-sm text-green-700">
                                <i className="bi bi-check-circle-fill"></i>
                                Данные сохранены
                            </div>
                        </div>
                    )}


                </div>

                                    {/* Кнопки */}
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

            <Footer />
        </div>
    );
};

export default MyProfile;