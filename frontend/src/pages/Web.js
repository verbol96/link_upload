import { useState, useEffect } from "react"
import {Row, Col, ProgressBar, Tooltip, OverlayTrigger} from 'react-bootstrap'
import { uploadFiles } from "../http/cloudApi"
import { ContactForm } from "../components/web/ContactForm"
import { OtherForm } from "../components/web/OtherForm"
import { FilesForm } from "../components/web/FilesForm"
import { v4 as uuidv4 } from 'uuid'
import { SendToDB } from "../http/tableApi"
import { createDir } from "../http/cloudApi"
import { PageAfterUpload } from "../components/web/PageAfterUpload"
import { NavBar } from "../components/web/NavBar"
import { useSelector } from "react-redux";
import Footer from "../components/admin/Footer"
import './stylePages.css'
import { getSettings } from "../http/dbApi"

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



    const [FIO, setFIO] = useState('')
    const [phone, setPhone] = useState('')
    const [typePost, setTypePost] = useState('E')
    const [city, setCity] = useState('')
    const [adress, setAdress] = useState('')
    const [postCode, setPostCode] = useState('')
    const [other, setOther] =useState('')
    const [typeAnswer, setTypeAnswer] = useState('instagram')
    const [nikname, setNikname] = useState('')

    const [formats, setFormats] = useState([
        {
            id: uuidv4(),
            type: 'photo',
            format: 'а6',
            paper: 'glossy',
            files: []
        }
    ])

    const AddFormat = () =>{
        setFormats([...formats, {
            id: uuidv4(),
            type: 'photo',
            format: 'а6',
            paper: 'glossy',
            files: []
        }])
    }

    const DeleteFormat = (el) =>{
        setFormats([...formats.filter(one=>one!==el)])
    }

    const [amountPhoto, setAmountPhoto] = useState(0)
    const [current, setCurrent] = useState(0)

    const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');

    const [settings, setSettings] = useState([])

    useEffect(()=>{
        async function getPriceList (){
            let value = await getSettings()
            setSettings(value)
        }
        getPriceList()

    }, [])

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
          return sum+PriceList(el.format)*el.amount
      },0 )
    
      return pr.toFixed(2)
      }

    const upload = async() =>{
        const photo = formats.reduce((acc,el)=> {
            const ff =() =>{
                switch(el.type){
                    case 'photo': return 'photo'
                    case 'holst': return 'holst'
                    case 'magnit': return 'magnit'
                    default: return 'photo'
                }
            } 
            let dd ={
                type: ff(),
                format: el.format,
                amount: el.files.length,
                paper: el.paper
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
            "other": 'Ответить в ' + typeAnswer + ': '+ nikname + '\n' + other,
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
        
        formats.forEach(async (formatOne) => {
            const parentFile = await createDir(formatOne.format+' '+formatOne.paper, MainDir.id);

            formatOne.files.forEach(async (file, index) => {
              
              await uploadFiles(file, parentFile.id)
              setCurrent((prev) => prev + 1);
            });
          });
    }
 
    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
           Можно загружать разные форматы, для этого нажмите "+ другой формат"
        </Tooltip>
      );
  
    return (
        <div>
        <div style={{display: 'flex', flexDirection: 'column',background: '#dbdbdb', minHeight: '95vh'}}>
                <NavBar />
                
                <div className="flex-container">
                    <div className="flex-item">

                    {current===0
                    ?
                    <>
                    <div className="title">Оформление заказа</div>
                    
                    <div className='filesForm'>
                    <Row><h4 className='textH4'><i className="bi bi-1-square" style={{color: 'black', marginRight: 10}}></i> Загрузка фото 
                    <OverlayTrigger
                    placement="right"
                    delay={{ show: 250, hide: 400 }}
                    overlay={renderTooltip}
                    >
                    <i className="bi bi-question-circle icon-question-circle"></i>
                    </OverlayTrigger> </h4></Row>
                    
                        {formats.map((el,index)=><FilesForm key={el.id} index={index} el={el} DeleteFormat={DeleteFormat}
                                                    formats={formats} setFormats={setFormats} />)}
                        <Row>
                            <Col md={2} className='mt-4'>
                                <button className="buttonForm buttonForm1" onClick={()=>AddFormat()}>+ другой формат</button>
                            </Col>
                        </Row>
                    </div>   

                    <ContactForm 
                        FIO={FIO} setFIO={setFIO}
                        phone={phone} setPhone={setPhone}
                        typePost={typePost} setTypePost={setTypePost}
                        city={city} setCity={setCity}
                        adress={adress} setAdress={setAdress}
                        postCode={postCode} setPostCode={setPostCode}
                         adressUser={adressUser}
                        />
                    
                    <OtherForm other={other} setOther={setOther} 
                        typeAnswer={typeAnswer} setTypeAnswer={setTypeAnswer}
                        nikname={nikname} setNikname={setNikname} />

                    <Row className="mt-4 mb-5 ">
                        
                        <Col className="d-flex justify-content-center">
                            <button className="buttonForm" onClick={()=>upload()}>
                                <i className="bi bi-cart3" style={{marginRight: 10}}></i> Отправить заказ!</button>
                        </Col>
                    </Row>
                    </>
                    :
                    current===amountPhoto ?
                        <PageAfterUpload amountPhoto={amountPhoto} phone = {phone} />
                    :
                    <Row>
                        <h5>Идет оформление заказа...</h5>
                        <ProgressBar animated now={100} label={`Загружено фото: ${current} из ${amountPhoto}`} />
                        <h6>Не закрывайте и не обновляйте страницу до окончания загрузки!</h6>
                    </Row>

                    }
                    
                </div>
                </div>
            
            
        </div>
        <div style={{marginTop: 'auto'}}>
        <Footer />
    </div>
    </div>
    )
}

export default Web

