import { useState, useEffect } from "react"
import { uploadFiles } from "../http/cloudApi"
import { ContactForm } from "../components/web/ContactForm"
import { v4 as uuidv4 } from 'uuid'
import { SendToDB } from "../http/tableApi"
import { createDir } from "../http/cloudApi"
import { PageAfterUpload } from "../components/web/PageAfterUpload"
import { useSelector } from "react-redux";
import Footer from "../components/admin/Footer"
import { getSettings, updateOrder } from "../http/dbApi"
import { PageUpload } from "../components/web/PageUpload"
import { SendGroup } from "../components/web/SendGroup"
import { FileForm } from "../components/web/FileForm"
import { NavBar } from "../components/admin/NavBar"

const Web = () => {

    const adressUser = useSelector(state => state.private.user)
    const isAuth = useSelector(state => state.auth.auth)
    const user = useSelector(state => state.private.user)

    const [R, setR] = useState(1)
    const [R1, setR1] = useState(1)
    const [E, setE] = useState(1)

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

    useEffect(() => {
        async function getPriceList() {
            let value = await getSettings()
            setSettings(value)

            setR(Number(value.find(el => el.title === 'R')?.price) ?? 0);
            setR1(Number(value.find(el => el.title === 'R1')?.price) ?? 0);
            setE(Number(value.find(el => el.title === 'E')?.price) ?? 0);
        }
        getPriceList()
    }, [])

    const [FIO, setFIO] = useState('')
    const [phone, setPhone] = useState('')
    const [typePost, setTypePost] = useState('E')
    const [city, setCity] = useState('')
    const [adress, setAdress] = useState('')
    const [postCode, setPostCode] = useState('')
    const [other, setOther] = useState('')
    const [amountPhoto, setAmountPhoto] = useState(0)
    const [current, setCurrent] = useState(0)
    const [step, setStep] = useState(0)
    const [settings, setSettings] = useState([])
    const [filesPrev, setFilesPrev] = useState([[]])
    const [formats, setFormats] = useState([
        {
            id: uuidv4(),
            type: 'photo',
            format: 'а6',
            paper: 'glossy',
            copies: 1,
            files: []
        }
    ])
    const [notLoad, setNotLoad] = useState([[]])
    const [item, setItem] = useState(0)
    const [isValid, setIsValid] = useState(false)

    const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');

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

    const DeleteFormat = (el) => {
        const confirmation = window.confirm('Вы уверены, что хотите удалить этот формат?')

        if (confirmation) {
            setTimeout(() => {
                if (formats.length === 1) return;
                setFormats([...formats.filter(one => one !== el)])
                setNotLoad(prev => [...prev.filter((one, index) => index !== item)])
                setFilesPrev(prev => [...prev.filter((one, index) => index !== item)])
                setItem(prev => {
                    if (prev === 0) return 0
                    else return prev - 1
                })

            }, 100)

        }
    }

    const PriceList = (format) => {
        let price = 0
        settings.forEach(el => {
            if (el.title === format) {
                price = el.price
            }
        })
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
        if (totalFiles > 499) {
            discount = 0.15;
        } else if (totalFiles > 199) {
            discount = 0.10;
        }
        const finalCost = totalCost * (1 - discount);

        return finalCost.toFixed(2);
    };

    const [filesCount, setFilesCount] = useState(0);

    useEffect(() => {
        if (formats) {
            let count = formats.reduce((total, el) => total + el.files.length * el.copies, 0);
            setFilesCount(count);
        }
    }, [formats]);

    const isHolst = () => {
        return formats.some((el) => el.type === "holst");
    };

    const calcDelivery = (value) => {
        if (SumTeorIn() === 0) return 0

        const countHolsts = () => {
            return formats.reduce((count, el) => {
                return el.type === "holst" ? count + el.files.length * el.copies : count;
            }, 0);
        };

        switch (value) {
            case 'E': {
                const calculateCommission = () => {
                    const commission = SumTeorIn() * 0.015;
                    return Math.max(commission, 0.30);
                };

                let baseCost;
                if (filesCount + 250 * countHolsts() < 300) { baseCost = E;
                } else { baseCost = E + 0.9; }

                const additionalCost = 0.015 * SumTeorIn();
                const commission = calculateCommission();

                const totalCost = baseCost + additionalCost + commission;

                return parseFloat(totalCost.toFixed(2));
            }
            case 'E1':
                if (filesCount + 250 * countHolsts() < 300) return E;
                return E + 0.9;
            case 'R1': {
                if (isHolst()) {
                    const calculateCost = () => {
                        const baseCost = R;
                        const massa = filesCount * 3 + countHolsts() * 700
                        const totalCost = baseCost + Math.max((massa - 1000) / 100, 0) * 0.09 + (massa > 1000 ? 1 : 0);
                        return totalCost.toFixed(2);
                    };

                    return calculateCost()
                }

                const baseCost = R1;
                const additionalCostPerGroup = 0.48;
                const groupSize = 30;

                const additionalGroups = Math.max(0, Math.ceil((filesCount - groupSize) / groupSize));

                const totalCost = baseCost + additionalCostPerGroup * additionalGroups;

                return totalCost.toFixed(2);
            }
            case 'R': {
                const calculateCost = () => {
                    const baseCost = R;
                    const additionalCost = SumTeorIn() * 0.03;
                    const calculateTransferFee = () => {
                        const sum = SumTeorIn();
                        const commissionRate = sum > 200 ? 0.02 : 0.03;
                        const commission = sum * commissionRate;
                        return Math.max(commission, 1);
                    };
                    const transferFee = calculateTransferFee();
                    const totalCost = baseCost + additionalCost + transferFee;

                    return totalCost.toFixed(2);
                };

                return calculateCost()
            };
            default: return 0;
        }
    }

    const ShowDiscount = () => {
        const amount = formats.reduce((sum, el) => {
            return sum + el.files.length * el.copies
        }, 0)

        const totalCost = formats.reduce((sum, el) => {
            return sum + PriceList(el.format) * el.files.length * el.copies;
        }, 0);

        if (amount > 499) return `применена скидка 15% (без скидки ${totalCost.toFixed(2)}р)`
        if (amount > 199) return `применена скидка 10% (без скидки ${totalCost.toFixed(2)}р)`
        return ''
    }

    const upload = async () => {
        setStep(1)
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
            let dd = {
                id: el.id,
                type: ff(),
                format: el.format,
                amount: el.files.length,
                paper: el.paper,
                copies: el.copies
            }
            return [...acc, dd]

        }, [])

        const amount = formats.reduce((acc, el) => {
            return acc + el.files.length
        }, 0)
        setAmountPhoto(amount)

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
            "price": other?.toLowerCase().includes('переделать') ? 0 : SumTeorIn(photo),
            "price_deliver": (() => {
                if (typePost === 'R1') return calcDelivery(typePost)
                else return 0
            })(),
            "codeOutside": '',
            "oblast": '',
            "raion": '',
            'auth': isAuth,
            'phoneUser': user.phone,
            'status': 0,
            'origin': 'website'
        }
        
        const userData = await SendToDB(data)

        const typePostName = () => {
            if (typePost === 'R' || typePost === 'R1' || typePost === 'R2') return 'R'
            if (typePost === 'E' || typePost === 'E1') return 'E'
        }
        const MainDir = await createDir(typePostName() + (userData.order_number % 1000))

        let newUserData = { ...userData }
        newUserData.main_dir_id = MainDir.id
        newUserData.phoneUser = userData.user.phone
        newUserData.photo = userData.photos
        await updateOrder(userData.id, newUserData)

        for (let formatOne of formats) {
            const parentFile = await createDir(formatOne.format + '_' + formatOne.paper + '_копий_' + formatOne.copies, MainDir.id);

            const uploadPromises = formatOne.files.map(async (file) => {
                await uploadFiles(file, parentFile.id, formatOne.id);
                setCurrent((prev) => prev + 1);
            });

            await Promise.all(uploadPromises);
        }
        setStep(2);
    }

    return (
        <div className="flex flex-col bg-[#eaeaea] min-h-screen">

            <NavBar />

            {/* Заголовок */}
            {step === 0 &&
            <div className="font-light text-[20px] md:text-[35px] mt-[15px] md:mt-10 text-[#17252A] text-center">
                Оформление заказа
            </div>
            }

            {step === 0 ?
                <div className="flex flex-col w-[95%] md:w-[90%] mx-auto">
                    <div className="bg-white rounded-[5px] p-[10px] md:p-[30px] shadow-[0px_0px_6px_1px_rgba(61,96,94,0.38)] mt-5">

                        <h4 className="font-light text-[16px] md:text-[20px] p-[5px] pb-[25px] pt-0 text-[#2C3531] my-[10px] md:my-0">
                            <i className="bi bi-1-square text-black mr-[10px]"></i>
                            Загрузка фото
                        </h4>

                        {/* Табы форматов */}
                        <div className="w-full flex gap-[2px]">
                            {formats.map((el, index) =>
                                <button
                                    className={`w-[40%] md:w-[20%] rounded-t-[5px] mr-[5px] text-white
                                             text-[12px] md:text-[14px]
                                            truncate md:whitespace-normal md:overflow-visible
                                            ${index === item
                                                ? 'bg-[#164a4a] border-[#164a4a]'
                                                : 'bg-teal-900/30 border-teal-900/30'
                                            }`}
                                    onClick={() => setItem(index)}
                                    key={index}
                                >
                                    <div className="flex justify-around whitespace-nowrap">
                                        <div className="truncate">{settings.find(s => s.title === el.format)?.name || 'not found'}</div>
                                        <div className="min-w-max">
                                            <i
                                                onClick={() => DeleteFormat(el)}
                                                className="bi bi-x-lg text-white"
                                            ></i>
                                        </div>
                                    </div>
                                </button>)
                            }

                            {formats.length < 6 &&
                                <button
                                    className="w-[18%] md:w-[5%] bg-[#e1eceb] border-none rounded-t-[5px] mr-[5px]"
                                    onClick={() => AddFormat()}
                                >
                                    +
                                </button>
                            }
                        </div>

                        <FileForm item={item} setFormats={setFormats} formats={formats}
                                   setFilesPrev={setFilesPrev} filesPrev={filesPrev[item]}
                                   notLoad={notLoad} setNotLoad={setNotLoad} />

                        <div>
                            <div className="mt-10 flex gap-[10px] font-light text-[13px] flex-wrap">
                                {formats.map((el, index) =>
                                    <div
                                        className={`rounded-[3px] px-5 py-[5px] text-center text-[#2C3531] cursor-pointer
                                                ${index === item
                                                    ? 'border-2 border-[#2C3531]'
                                                    : 'border border-[#116466]'
                                                }`}
                                        onClick={() => setItem(index)}
                                        key={index}
                                    >
                                        Цена за {el.files.length * el.copies}шт - {(PriceList(el.format) * el.files.length * el.copies).toFixed(2)}р
                                    </div>
                                )}
                            </div>

                            <div className="mt-[15px] md:mt-[10px] md:ml-5 text-center md:text-left font-light text-[18px] md:text-[15px]">
                                <label>Сумма за все: {other?.toLowerCase().includes('переделать') ? 0 : SumTeorIn()}</label>
                                <div className="text-[12px] font-normal">{ShowDiscount()}</div>
                            </div>

                            {formats[0]?.files?.length > 0 && SumTeorIn() < 10 &&
                                <div>
                                    <label className="text-[12px] text-orange-500 ml-8">(Минимальный заказ 10р)</label>
                                </div>
                            }
                        </div>
                    </div>

                    <ContactForm
                        FIO={FIO} setFIO={setFIO}
                        phone={phone} setPhone={setPhone}
                        typePost={typePost} setTypePost={setTypePost}
                        city={city} setCity={setCity}
                        adress={adress} setAdress={setAdress}
                        postCode={postCode} setPostCode={setPostCode}
                        adressUser={adressUser} other={other} setOther={setOther} isValid={isValid}
                        formats={formats} SumTeorIn={SumTeorIn} isHolst={isHolst} calcDelivery={calcDelivery}
                    />

                    <SendGroup phone={phone} upload={upload} isAuth={isAuth} setIsValid={setIsValid} />
                </div>
            :
            step === 2 ?
                <PageAfterUpload
                    amountPhoto={amountPhoto}
                    phone={phone} />
                :
                <PageUpload
                    phone={phone}
                    current={current}
                    amountPhoto={amountPhoto} />
            }

            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    )
}

export default Web