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
import style from './Web.module.css'
import { SendGroup } from "../components/web/SendGroup" 
import { FileForm } from "../components/web/FileForm"
import { NavBar } from "../components/admin/NavBar"

const Web = () =>{

    const adressUser = useSelector(state=>state.private.user)
    const isAuth = useSelector(state=>state.auth.auth)
    const user = useSelector(state=>state.private.user)

    useEffect(() => {
        if (adressUser!==0) {
            setFIO(adressUser.FIO ?? '');
            setPhone(user.phone ?? '');
            setTypePost(adressUser.typePost ?? 'E');
            setCity(adressUser.city ?? '');
            setAdress(adressUser.adress ?? '');
            setPostCode(adressUser.postCode ?? '');
        }
      }, [adressUser, user]);

    useEffect(()=>{
        async function getPriceList (){
            let value = await getSettings()
            setSettings(value)
        }
        getPriceList()
    }, [])

    const [FIO, setFIO] = useState('')
    const [phone, setPhone] = useState('')
    const [typePost, setTypePost] = useState('E')
    const [city, setCity] = useState('')
    const [adress, setAdress] = useState('')
    const [postCode, setPostCode] = useState('')
    const [other, setOther] =useState('')
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
    const [item, setItem] = useState(0)
    const [isValid, setIsValid] = useState(false)

    const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');

    const AddFormat = () =>{
        setFormats([...formats, {
            id: uuidv4(),
            type: 'photo',
            format: 'а6',
            paper: 'glossy',
            copies: 1,
            files: []
        }])
        setFilesPrev(prev=>[...prev, []])
        setItem(formats.length)
    }

    const DeleteFormat = (el) =>{
        const confirmation = window.confirm('Вы уверены, что хотите удалить этот формат?')
        
        if (confirmation) {
            setTimeout(()=>{
            if(formats.length===1) return;
            setFormats([...formats.filter(one=>one!==el)])
            setFilesPrev(prev=>[...prev.filter((one,index)=>index!==item)])
            setItem(prev=>{
                if(prev===0) return 0
                else return prev-1
            })

            },100)
            
        }
    }

    const PriceList = (format) =>{
        let price = 0
        settings.forEach(el=>{
          
            if(el.title === format) {
              
                price = el.price
            }
        })
    
        return price
    }
    
    const SumTeor =(photo)=> {
        const pr = photo.reduce((sum, el)=>{
            return sum+PriceList(el.format)*el.amount*el.copies
        },0 )
    return pr.toFixed(2)
    }

    const SumTeorIn =()=> {
        const pr = formats.reduce((sum, el)=>{
            return sum+PriceList(el.format)*el.files.length*el.copies
        },0 )
    return pr.toFixed(2)
    }

    const upload = async() =>{
        setStep(1)
        const photo = formats.reduce((acc,el)=> {
            const ff =() =>{
                switch(el.type){
                    case 'photo': return 'photo'
                    case 'holst': return 'holst'
                    case 'magnit': return 'magnit'
                    default: return 'photo'
                }
            } 
            //console.log(el.id)
            let dd ={
                id: el.id,
                type: ff(),
                format: el.format,
                amount: el.files.length,
                paper: el.paper,
                copies: el.copies
            }
            return [...acc, dd]
            
        },[])
        
        const amount = formats.reduce((acc,el)=>{
            return acc+el.files.length
        },0)
        setAmountPhoto(amount)
        
        const data = {
            "FIO": FIO,
            "phone": removeNonNumeric(phone),
            "typePost": typePost,
            "city": city,
            "adress": adress,
            "postCode": postCode,
            "other": other,
            "notes": '',
            "photo": photo, 
            "price": SumTeor(photo),
            "codeOutside": '',
            "oblast": '',
            "raion": '',
            'auth': isAuth,
            'phoneUser': user.phone,
            'status': 0
        }

        const userData = await SendToDB(data)
        
        const MainDir = await createDir(typePost+(userData.order_number%99+1))

        let newUserData = {...userData}
        newUserData.main_dir_id = MainDir.id
        newUserData.phoneUser = userData.user.phone
        newUserData.photo = userData.photos
        await updateOrder(userData.id, newUserData)

        for (let formatOne of formats) {
            const parentFile = await createDir(formatOne.format + ' ' + formatOne.paper, MainDir.id);

            const uploadPromises = formatOne.files.map(async (file) => {
                await uploadFiles(file, parentFile.id, formatOne.id);
                setCurrent((prev) => prev + 1);
            });
        
            await Promise.all(uploadPromises);
        }
        setStep(2);
    }

    const ShowTitle = (value) =>{
        switch(value){
            case 'photo': return 'Фото'
            case 'holst': return 'Холст'
            case 'magnit': return 'Магнит'
            case 'а6': return '10x15 стандарт'
            case 'дд': return '10x10 квадрат'
            case 'пол': return '10х12 полароид'
            case 'мини': return '7х9 миниПолароид'
            case 'а5': return '15х20'
            case 'а4': return '20х30'
            case '5x8': return '5х8'
            case '10x10': return '10х10'
            case '30x40': return '30x40'
            case '40x40': return '40x40'
            case '40x55': return '40x55'
            case '50x70': return '50x70'
            case '55x55': return '55x55'
            case '55x80': return '55x80s'
            case '<а6': return 'до 10х15'
            case '<а7': return 'до 7.5х10'
            case '<а5': return 'до 15х20'
            case '<а4': return 'до 20х30'
            default: return 'неизвестно'
        }
    }

    return (
        <div className={style.wrapper}>

            <NavBar />

            <div className={style.titlePage}>
                Оформление заказа
            </div>
            
            {step===0 ?
                <div className={style.flexContainer}>
                    <div className={style.filesForm}>

                        <h4 className={style.textH4}>
                            <i className="bi bi-1-square" style={{color: 'black', marginRight: 10}}></i> 
                            Загрузка фото 
                        </h4>

                        <div className={style.formatNavigate}> 
                            {formats.map((el,index)=>
                                <button className={style.formatNavBtn} style={{background: index===item && '#164a4a',color: index===item && 'white',border: index===item && '1px solid #164a4a'}} 
                                        onClick={()=>setItem(index)} 
                                        key={index}>
                                    <div className={style.navLabel}>
                                        <div>{ShowTitle(el.format)}</div>
                                        <div className={style.navLabelDelete}><i onClick={()=>DeleteFormat(el)} style={{color: 'white'}} className="bi bi-x-lg"></i></div>
                                         
                                    </div>
                                </button>)
                            }  
                            <button className={style.formatNavBtnAdd} onClick={()=>AddFormat()}>+</button>
                        </div>
                    

                        <FileForm item={item} setFormats={setFormats} formats={formats}
                                   setFilesPrev={setFilesPrev} filesPrev={filesPrev[item]} />

                        <div>
                            <div className={style.formatsInfo}>
                            {
                                formats.map((el,index)=><div className={style.formatsInfoItem} onClick={()=>setItem(index)}
                                                             style={{cursor: 'pointer',border: index===item && '2px solid #2C3531'}}
                                                             key={index}>
                                    Цена за {el.files.length*el.copies}шт - {(PriceList(el.format)*el.files.length*el.copies).toFixed(2)}р
                                </div>)
                            }
                            </div>
                            <div className={style.formatsInfoAll}>
                                <label>Сумма за все: {SumTeorIn()}</label>
                            </div>
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
                    />
    
                    <SendGroup phone={phone} upload={upload} isAuth={isAuth} setIsValid={setIsValid}  />
                </div>
            :
            step===2 ?
                <PageAfterUpload 
                        amountPhoto={amountPhoto}  
                        phone={phone} />
                :
                <PageUpload 
                        phone={phone}
                        current={current} 
                        amountPhoto={amountPhoto} />
            

            }
                             
            <div style={{marginTop: 'auto'}}>
                <Footer />
            </div>
        </div>
        
    )
}

export default Web

