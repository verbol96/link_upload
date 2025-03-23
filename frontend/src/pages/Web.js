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
    const [notLoad, setNotLoad] = useState([[]])
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
        setNotLoad(prev=>[...prev, []])
        setItem(formats.length)
    }

    const DeleteFormat = (el) =>{
        const confirmation = window.confirm('Вы уверены, что хотите удалить этот формат?')
        
        if (confirmation) {
            setTimeout(()=>{
            if(formats.length===1) return;
            setFormats([...formats.filter(one=>one!==el)])
            setNotLoad(prev=>[...prev.filter((one,index)=>index!==item)])
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

    const SumTeorIn = () => {
        // Рассчитываем общую стоимость без скидки
        const totalCost = formats.reduce((sum, el) => {
          return sum + PriceList(el.format) * el.files.length * el.copies;
        }, 0);
      
        // Рассчитываем общее количество файлов с учётом копий
        const totalFiles = formats.reduce((sum, el) => {
          return sum + el.files.length * el.copies;
        }, 0);
      
        // Применяем скидку
        let discount = 0;
        if (totalFiles > 499) {
          discount = 0.15; // 15% скидка
        } else if (totalFiles > 199) {
          discount = 0.10; // 10% скидка
        }
        // Итоговая стоимость с учётом скидки
        const finalCost = totalCost * (1 - discount);
      
        // Возвращаем стоимость, округлённую до 2 знаков после запятой
        return finalCost.toFixed(2);
      };

      const [filesCount, setFilesCount] = useState(0);

      useEffect(() => {
          if (formats) {
              let count = formats.reduce((total, el) => total + el.files.length*el.copies, 0);
              setFilesCount(count);
          }
      }, [formats]); // Зависимость от `formats`

      const isHolst = () => {
          return formats.some((el) => el.type === "holst");
        };

      const calcDelivery = (value) =>{
          if(SumTeorIn() == 0  ) return 0
          
          const countHolsts = () => {
          return formats.reduce((count, el) => {
              return el.type === "holst" ? count + el.files.length*el.copies : count;
          }, 0);
          };
          
          switch(value){
              case 'E': {
                  const calculateCommission = () => {
                    const commission = SumTeorIn() * 0.015; // 1.5% от суммы
                    return Math.max(commission, 0.30); // Не менее 0,30 BYN
                  };
                
                  let baseCost;
                  if (filesCount+250*countHolsts() < 300) { baseCost = 5.15;
                  } else {baseCost = 5.87;}
                
                  const additionalCost = 0.015 * SumTeorIn(); // Дополнительная стоимость
                  const commission = calculateCommission(); // Комиссия
                
                  const totalCost = baseCost + additionalCost + commission;
                
                  return parseFloat(totalCost.toFixed(2));
                }
              case 'E1': {
                  if(filesCount+250*countHolsts() <  300) return 5.15
                  return 5.87
              };
              case 'R1': {
                  if(isHolst()){
                      const calculateCost = () => {
                          const baseCost = 4; // Базовая стоимость пересылки
                          const massa = filesCount * 3 + countHolsts() * 700
                          const totalCost = baseCost + Math.max((massa - 1000) / 100, 0) * 0.09 + (massa > 1000 ? 1 : 0);
                          return totalCost.toFixed(2); // Округляем до 2 знаков после запятой
                        };
  
                        return calculateCost()
                  }

                  const baseCost = 2.04; // Базовая стоимость для первых 30 файлов
                  const additionalCostPerGroup = 0.42; // Дополнительная стоимость за каждые 30 файлов
                  const groupSize = 30; // Размер группы файлов
                
                  // Вычисляем количество полных групп сверх первых 30 файлов
                  const additionalGroups = Math.max(0, Math.ceil((filesCount - groupSize) / groupSize));
                
                  // Общая стоимость
                  const totalCost = baseCost + additionalCostPerGroup * additionalGroups;
                
                  return totalCost.toFixed(2); // Округляем до 2 знаков после запятой
                }
              case 'R': {
                  const calculateCost = () => {
                      const baseCost = 4; // Базовая стоимость пересылки
                      const additionalCost = SumTeorIn() * 0.03; // 3% от базовой стоимости
                      const calculateTransferFee = () => {
                          const sum = SumTeorIn(); // Получаем сумму
                          const commissionRate = sum > 200 ? 0.02 : 0.03; // 2% если сумма > 200, иначе 3%
                          const commission = sum * commissionRate; // Рассчитываем комиссию
                          return Math.max(commission, 1); // Не менее 1 BYN
                        };
                      const transferFee = calculateTransferFee();
                      const totalCost = baseCost + additionalCost + transferFee;
                    
                      return totalCost.toFixed(2); // Округляем до 2 знаков после запятой
                    };

                    return calculateCost()
              };
              default: return 0;
          }
      }

    const ShowDiscount = () =>{
        const amount = formats.reduce((sum, el)=>{
            return sum+ el.files.length*el.copies
        }, 0)

        const totalCost = formats.reduce((sum, el) => {
            return sum + PriceList(el.format) * el.files.length * el.copies;
          }, 0);

        if(amount>499) return `применена скидка 15% (без скидки ${totalCost.toFixed(2)}р)`
        if(amount>199) return `применена скидка 10% (без скидки ${totalCost.toFixed(2)}р)`
        return ''
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
            //"firstClass": typePost==='R1' ? true : false,
            "city": city,
            "adress": adress,
            "postCode": postCode,
            "other": (() => {
                if (typePost === 'E1' || typePost === 'R1') {
                    return "--Данные для оплаты появятся здесь после проверки заказа\n - " + other;
                }
                return other;
                })(),
            "notes": '---' + calcDelivery(typePost),
            "photo": photo, 
            "price": SumTeor(photo),
            "codeOutside": '',
            "oblast": '',
            "raion": '',
            'auth': isAuth,
            'phoneUser': user.phone,
            'status': 0,
            'origin': 'website'
        }

        const userData = await SendToDB(data)
        const typePostName = (typePost==='R1') ? 'R' : typePost
        const MainDir = await createDir(typePostName+(userData.order_number%1000))

        let newUserData = {...userData}
        newUserData.main_dir_id = MainDir.id
        newUserData.phoneUser = userData.user.phone
        newUserData.photo = userData.photos
        await updateOrder(userData.id, newUserData)

        for (let formatOne of formats) {
            const parentFile = await createDir(formatOne.format + '_' + formatOne.paper + '_копий_' +formatOne.copies, MainDir.id);

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
            case 'дд': return '10x10 (с рамкой)'
            case 'м7x10': return '7x10 (с рамкой)'
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
            case '55x80': return '55x80'
            case '<а6': return 'другой до 10х15'
            case '<а7': return 'другой до 7.5х10'
            case '<а5': return 'другой до 15х20'
            case '<а4': return 'другой до 20х30'
            default: return false;
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

                            {
                                (formats.length < 6) && <button className={style.formatNavBtnAdd} onClick={()=>AddFormat()}>+</button>
                            }
                        </div>
                    

                        <FileForm item={item} setFormats={setFormats} formats={formats}
                                   setFilesPrev={setFilesPrev} filesPrev={filesPrev[item]}
                                   notLoad={notLoad} setNotLoad={setNotLoad} />

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
                                <div style={{fontSize: 12, fontWeight: 'normal'}}>{(ShowDiscount())}</div>
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
                            formats = {formats} SumTeorIn={SumTeorIn} isHolst={isHolst} calcDelivery={calcDelivery}
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

