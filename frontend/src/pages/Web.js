import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { uploadFiles, createDir } from "../http/cloudApi"
import { getSettings, updateOrder } from "../http/dbApi"
import Footer from "../components/admin/Footer"
import { NavBar } from "../components/admin/NavBar"
import { ContactForm } from "../components/web/ContactForm"
import { PageAfterUpload } from "../components/web/PageAfterUpload"
import { PageUpload } from "../components/web/PageUpload"
import { SendGroup } from "../components/web/SendGroup"
import { FileForm } from "../components/web/FileForm"
import { setLogUser } from "../http/authApi"
import { $host } from "../http"

// ============ БЛОК-СЕКЦИЯ ============
const SectionBlock = ({ number, title, children, sectionRef }) => (

    <section ref={sectionRef} className="relative bg-white border border-slate-200/80 rounded-xl shadow-md
                        mt-6 md:mt-4">
        <div className="absolute left-3 md:left-6 top-0 -translate-y-1/2
                        flex items-center gap-2 max-w-[calc(100%-24px)]">
            <span className="shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#19766d]
                            flex items-center justify-center
                            text-[11px] md:text-[12px] font-semibold text-white shadow-sm">
                {number}
            </span>
            <span className="h-7 md:h-8 flex items-center px-2.5 md:px-3.5 rounded-lg
                            bg-[#eaf4f2] border border-[#19766d]/15
                            text-[12px] md:text-[13.5px] font-semibold text-[#285e59]
                            truncate">
                {title}
            </span>
        </div>

        <div className="p-3 md:p-5 pt-7 md:pt-8">
            {children}
        </div>
    </section>
);

// ============ ГЛАВНЫЙ КОМПОНЕНТ ============
const Web = () => {
    const adressUser = useSelector(state => state.private.user)
    const isAuth = useSelector(state => state.auth.auth)
    const user = useSelector(state => state.private.user)

    const [R, setR] = useState(1)
    const [R1, setR1] = useState(1)
    const [E, setE] = useState(1)
    const [activeStep, setActiveStep] = useState(0)
    const checkoutRef = useRef(null)
    const checkoutLoggedRef = useRef(false)

    const [FIO, setFIO] = useState('')
    const [phone, setPhone] = useState('')
    const [typePost, setTypePost] = useState('E')
    const [city, setCity] = useState('')
    const [adress, setAdress] = useState('')
    const [postCode, setPostCode] = useState('')
    const [other, setOther] = useState('')

    const [amountPhoto, setAmountPhoto] = useState(0)
    const [current, setCurrent] = useState(0)
    const [settings, setSettings] = useState([])
    const [filesPrev, setFilesPrev] = useState([[]])
    const [formats, setFormats] = useState([{
        id: uuidv4(),
        type: 'photo',
        format: 'а6',
        paper: 'glossy',
        copies: 1,
        files: []
    }])
    const [notLoad, setNotLoad] = useState([[]])
    const [item, setItem] = useState(0)
    const [isValid, setIsValid] = useState(false)
    const [filesCount, setFilesCount] = useState(0)

    const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');

    // ===== Адрес пользователя =====
    useEffect(() => {
        if (adressUser !== 0) {
            setFIO(adressUser.FIO ?? '');
            setPhone(user.phone ?? '');
            setTypePost(adressUser.typePost ?? 'E');
            setCity(adressUser.city ?? '');
            setAdress(adressUser.adress ?? '');
            setPostCode(adressUser.postCode ?? '');
        }
    }, [adressUser, user]);

    // ===== Прайс-лист =====
    useEffect(() => {
        async function getPriceList() {
            const value = await getSettings()
            setSettings(value)
            setR(Number(value.find(el => el.title === 'R')?.price) ?? 0);
            setR1(Number(value.find(el => el.title === 'R1')?.price) ?? 0);
            setE(Number(value.find(el => el.title === 'E')?.price) ?? 0);
        }
        getPriceList()
    }, [])

    // ===== Счётчик файлов =====
    useEffect(() => {
        if (formats) {
            const count = formats.reduce((total, el) => total + el.files.length * el.copies, 0);
            setFilesCount(count);
        }
    }, [formats]);

    useEffect(() => {
    if (activeStep === 10 || activeStep === 11) {
        window.scrollTo(0, 0);
    }
}, [activeStep]);

    // ===== Форматы =====
    const AddFormat = () => {
        setFormats([...formats, {
            id: uuidv4(),
            type: 'photo',
            format: 'а6',
            paper: 'glossy',
            copies: 1,
            files: []
        }])
        setFilesPrev(prev => [...prev, []])
        setNotLoad(prev => [...prev, []])
        setItem(formats.length)
    }

    const DeleteFormat = (index) => {
        if (formats.length === 1) return;

        setFormats(prev => prev.filter((_, i) => i !== index))
        setNotLoad(prev => prev.filter((_, i) => i !== index))
        setFilesPrev(prev => prev.filter((_, i) => i !== index))
        setItem(prev => {
            if (prev === index) return Math.max(0, index - 1)
            if (prev > index) return prev - 1
            return prev
        })
    }

    // ===== Расчёты =====
    const PriceList = (format) => {
        let price = 0
        settings.forEach(el => { if (el.title === format) price = el.price })
        return price
    }

    const SumTeorIn = () => {
        const totalCost = formats.reduce((sum, el) => {
            return sum + PriceList(el.format) * el.files.length * el.copies;
        }, 0);

        const totalFiles = formats.reduce((sum, el) => {
            return sum + el.files.length * el.copies;
        }, 0);

        let discount = 0;
        if (totalFiles > 499) discount = 0.15;
        else if (totalFiles > 199) discount = 0.10;

        return (totalCost * (1 - discount)).toFixed(2);
    };

    const isHolst = () => formats.some((el) => el.type === "holst");

    const calcDelivery = (value) => {
        if (SumTeorIn() === 0) return 0
        const countHolsts = () => formats.reduce((c, el) => el.type === 'holst' ? c + el.files.length * el.copies : c, 0);

        switch (value) {
            case 'E': {
                const calculateCommission = () => Math.max(SumTeorIn() * 0.015, 0.30);
                const baseCost = filesCount + 250 * countHolsts() < 300 ? E : E + 0.9;
                const additionalCost = 0.015 * SumTeorIn();
                const commission = calculateCommission();
                return parseFloat((baseCost + additionalCost + commission).toFixed(2));
            }
            case 'E1':
                return filesCount + 250 * countHolsts() < 300 ? E : E + 0.9;
            case 'R1': {
                if (isHolst()) {
                    const baseCost = R;
                    const massa = filesCount * 3 + countHolsts() * 700
                    return (baseCost + Math.max((massa - 1000) / 100, 0) * 0.09 + (massa > 1000 ? 1 : 0)).toFixed(2);
                }
                const baseCost = R1;
                const additionalGroups = Math.max(0, Math.ceil((filesCount - 30) / 30));
                return (baseCost + 0.48 * additionalGroups).toFixed(2);
            }
            case 'R': {
                const baseCost = R;
                const additionalCost = SumTeorIn() * 0.03;
                const sum = SumTeorIn();
                const commissionRate = sum > 200 ? 0.02 : 0.03;
                const transferFee = Math.max(sum * commissionRate, 1);
                return (baseCost + additionalCost + transferFee).toFixed(2);
            }
            default: return 0;
        }
    }

    const ShowDiscount = () => {
        const amount = formats.reduce((sum, el) => sum + el.files.length * el.copies, 0)
        const totalCost = formats.reduce((sum, el) => sum + PriceList(el.format) * el.files.length * el.copies, 0);
        if (amount > 499) return `Скидка 15% · без скидки ${totalCost.toFixed(2)} р`
        if (amount > 199) return `Скидка 10% · без скидки ${totalCost.toFixed(2)} р`
        return ''
    }

    const totalPrice = other?.toLowerCase().includes('переделать') ? 0 : SumTeorIn();
    const deliveryPrice = typePost === 'R1' ? calcDelivery(typePost) : 0;
    const hasFiles = formats.some(f => f.files.length > 0);

    useEffect(() => {
        if (!hasFiles || checkoutLoggedRef.current) return;

        const node = checkoutRef.current;
        if (!node) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !checkoutLoggedRef.current) {
                checkoutLoggedRef.current = true;
                setLogUser({
                    event: 'checkout_opened',
                    eventType: 'info',
                    photosCount: formats.reduce((acc, el) => acc + el.files.length, 0),
                    format: formats.filter(el => el.files.length > 0).map(el => el.format).join(', ')
                });
                observer.disconnect();
            }
        }, { threshold: 0.35 });

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasFiles, formats]);

    // ===== ОТПРАВКА =====
    const upload = async () => {
        setActiveStep(10)

        const photo = formats.reduce((acc, el) => {
            const ff = () => {
                switch (el.type) {
                    case 'photo': return 'photo'
                    case 'holst': return 'holst'
                    case 'magnit': return 'magnit'
                    case 'poster': return 'poster'
                    default: return 'photo'
                }
            }
            return [...acc, {
                id: el.id,
                type: ff(),
                format: el.format,
                amount: el.files.length,
                paper: el.paper,
                copies: el.copies
            }]
        }, [])

        const amount = formats.reduce((acc, el) => acc + el.files.length, 0)
        setAmountPhoto(amount)
        setLogUser({
            event:'order_submit',
            eventType:'info',
            photosCount:amount,
            format:formats.map(el=>el.format).join(', ')
        });

        const data = {
            "FIO": FIO.toLowerCase(),
            "phone": removeNonNumeric(phone),
            "typePost": typePost,
            "city": city,
            "adress": adress,
            "postCode": postCode,
            "other": other,
            "notes": '',
            "photo": photo,
            "price": totalPrice,
            "price_deliver": deliveryPrice,
            "codeOutside": '',
            "oblast": '',
            "raion": '',
            'auth': isAuth,
            'phoneUser': user.phone,
            'status': 0,
            'origin': 'website'
        }

        let userData;
        try {
            const response = await $host.post('api/order/addOrder', data);
            userData = response.data;
        } catch (error) {
            setLogUser({
                event:'order_create_error',
                eventType:'error',
                photosCount:amount,
                format:formats.map(el=>el.format).join(', '),
                error:error?.response?.data?.message||error?.message||'Ошибка создания заказа'
            });
            throw error;
        }
        setLogUser({
            event:'order_created',
            eventType:'success',
            orderId:userData.order_number,
            photosCount:amount,
            format:formats.map(el=>el.format).join(', ')
        });

        const typePostName = () => {
            if (typePost === 'R' || typePost === 'R1' || typePost === 'R2') return 'R'
            if (typePost === 'E' || typePost === 'E1') return 'E'
        }

        let MainDir;
        try{
            MainDir=await createDir(typePostName()+(userData.order_number%1000));
        }catch(error){
            setLogUser({
                event:'order_folder_error',
                eventType:'error',
                orderId:userData.order_number,
                photosCount:amount,
                format:formats.map(el=>el.format).join(', '),
                error:error?.response?.data?.message||error?.message||'Ошибка создания папки заказа'
            });
            throw error;
        }

        const newUserData = { ...userData }
        newUserData.main_dir_id = MainDir.id
        newUserData.phoneUser = userData.user.phone
        newUserData.photo = userData.photos
        await updateOrder(userData.id, newUserData)

        for (const formatOne of formats) {
            let parentFile;
            try{
                parentFile=await createDir(
                    formatOne.format+'_'+formatOne.paper+'_копий_'+formatOne.copies,
                    MainDir.id
                );
            }catch(error){
                setLogUser({
                    event:'format_folder_error',
                    eventType:'error',
                    orderId:userData.order_number,
                    format:formatOne.format,
                    error:error?.response?.data?.message||error?.message||'Ошибка создания папки формата'
                });
                throw error;
            }
            const uploadPromises=formatOne.files.map(async(file)=>{
                try{
                    await uploadFiles(file,parentFile.id,formatOne.id);
                    setCurrent((prev)=>prev+1);
                }catch(error){
                    setLogUser({
                        event:'photo_upload_error',
                        eventType:'error',
                        orderId:userData.order_number,
                        format:formatOne.format,
                        error:error?.response?.data?.message||error?.message||'Ошибка загрузки фотографии'
                    });
                    throw error;
                }
            });
            await Promise.all(uploadPromises);
        }
        //уведомление в ТГ
        await $host.post(`api/order/uploadCompleted/${userData.id}`);

        setLogUser({
            event:'order_upload_completed',
            eventType:'success',
            orderId:userData.order_number,
            photosCount:amount,
            format:formats.map(el=>el.format).join(', ')
        });
        setActiveStep(11)
    }

    // ===== ОБЁРТКА С ВАЛИДАЦИЕЙ =====
    const handleSubmit = () => {
        const digits = phone.replace(/\D/g, '');

        if (!phone.trim() || digits.length < 9) {
            toast.error('Введите номер телефона', {
                description: 'По нему мы свяжемся, если что-то пойдёт не так',
            });
            setIsValid(true);
            setTimeout(() => setIsValid(false), 1500);
            return;
        }

        if (!hasFiles) {
            toast.error('Добавьте хотя бы одно фото');
            return;
        }

        upload();
    };

    if (activeStep === 10) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f8f8f7]">
                <NavBar />
                <div className="flex-1 w-[94%] mx-auto py-6">
                    <PageUpload phone={phone} current={current} amountPhoto={amountPhoto} />
                </div>
                <Footer />
            </div>
        )
    }

    if (activeStep === 11) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f8f8f7]">
                <NavBar />
                <div className="flex-1 w-[94%] mx-auto py-6">
                    <PageAfterUpload amountPhoto={amountPhoto} phone={phone} />
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-stone-100">
            <NavBar />

            <main className="flex-1 w-[94%] max-w-6xl mx-auto py-4 md:py-6">
                <div className="flex flex-col gap-6 md:gap-10 pt-4">

                    {/* ===== СЕКЦИЯ 1: ФОТО ===== */}
                    <SectionBlock number={1} title="Загрузка фотографий">

{/* Форматы как папки */}
<div className="flex items-end gap-1 overflow-x-auto mt-4 pb-1">
    {formats.map((el, index) => {
        const formatName = settings.find(s => s.title === el.format)?.name || el.format;
        const count = el.files.length * el.copies;
        const active = index === item;

        return (
            <button
                key={el.id}
                type="button"
                onClick={() => setItem(index)}
                className={`relative shrink-0 min-w-[130px] md:min-w-[170px]
                        h-[46px] md:h-[52px] px-2.5 md:px-3.5
                        flex items-center gap-1.5 md:gap-3 rounded-lg
                        border border-slate-300
                        transition-colors
                        ${active
                            ? 'bg-white text-slate-900'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
            >
                <i className={`bi ${active ? 'bi-folder2-open' : 'bi-folder'}
                            text-[20px] md:text-[25px] shrink-0
                            ${active ? 'text-[#19766d]' : 'text-slate-400'}`} />

                <span className="text-[12px] md:text-[13px] font-semibold truncate min-w-0 flex-1">
                    {formatName}
                </span>

                {count > 0 && (
                    <span className={`shrink-0 min-w-[22px] md:min-w-7 h-[22px] md:h-7 px-1.5
                                    rounded-full flex items-center justify-center
                                    text-[10px] md:text-[11px] font-bold
                                    ${active
                                        ? 'bg-[#dcecea] text-[#19766d]'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}>
                        {count}
                    </span>
                )}

                {active && (
                    <span className="absolute left-0 right-0 bottom-0 h-[3px]
                                    rounded-b-lg bg-[#19766d]" />
                )}
            </button>
        );
    })}

    {formats.length < 6 && (
        <button
            type="button"
            onClick={AddFormat}
            className="shrink-0 h-[46px] md:h-[52px] px-3 md:px-4 rounded-lg bg-white
                    flex items-center gap-2
                    text-[12px] md:text-[13px] font-semibold text-teal-900
                    hover:text-teal-950
                    transition-colors whitespace-nowrap"
        >
            <i className="bi bi-plus-circle text-[16px] md:text-[18px]" />
            <span className="hidden sm:inline">Другой формат</span>
            <span className="sm:hidden">Другой</span>
        </button>
    )}
</div>

                        <div className="h-px bg-teal-700 mt-2 mb-4" />

                        <FileForm
                            item={item}
                            setFormats={setFormats}
                            formats={formats}
                            setFilesPrev={setFilesPrev}
                            filesPrev={filesPrev[item]}
                            notLoad={notLoad}
                            setNotLoad={setNotLoad}
                            onDeleteFormat={DeleteFormat}
                        />

                        {/* Итого */}
                        
                            <div className="mt-4 pt-3 border-t border-teal-700
                                            flex items-center justify-between gap-3 flex-wrap">
                                <span className="text-[11px] md:text-[12px] uppercase tracking-wider
                                                font-semibold text-slate-400">
                                    Сумма заказа
                                </span>
                                <div className="text-right ml-auto">
                                    <span className="text-[20px] md:text-[26px] font-bold
                                                    text-slate-900 tabular-nums leading-none">
                                        {totalPrice} <span className="text-[14px] md:text-[15px] text-slate-400">р</span>
                                    </span>
                                    {ShowDiscount() && (
                                        <div className="text-[11px] text-teal-700 mt-1 font-medium">
                                            {ShowDiscount()}
                                        </div>
                                    )}
                                    {Number(SumTeorIn()) < 10 && (
                                        <div className="text-[11px] text-slate-400 mt-1">
                                            Минимальный заказ 10 р
                                        </div>
                                    )}
                                </div>
                            </div>
                        
                    </SectionBlock>

                    {/* ===== СЕКЦИЯ 2: ДАННЫЕ ===== */}
                    <SectionBlock number={2} title="Данные для отправки" sectionRef={checkoutRef}>
                        <ContactForm
                            FIO={FIO} setFIO={setFIO}
                            phone={phone} setPhone={setPhone}
                            typePost={typePost} setTypePost={setTypePost}
                            city={city} setCity={setCity}
                            adress={adress} setAdress={setAdress}
                            postCode={postCode} setPostCode={setPostCode}
                            adressUser={adressUser}
                            other={other} setOther={setOther}
                            isValid={isValid}
                            formats={formats}
                            SumTeorIn={SumTeorIn}
                            isHolst={isHolst}
                            calcDelivery={calcDelivery}
                        />
                    </SectionBlock>

                    {/* ===== ОТПРАВКА ===== */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3">
                        <SendGroup
                            phone={phone}
                            upload={handleSubmit}
                            isAuth={isAuth}
                            setIsValid={setIsValid}
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Web