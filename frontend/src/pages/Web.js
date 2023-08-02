import { useState, useEffect } from "react"
import {Row, Col, ProgressBar, Tooltip, OverlayTrigger} from 'react-bootstrap'
import { uploadFiles } from "../http/cloudApi"
import { ContactForm } from "../components/web/ContactForm"
import { OtherForm } from "../components/web/OtherForm"
import { FilesForm } from "../components/web/FilesForm"
import { v4 as uuidv4 } from 'uuid'
import {nanoid} from 'nanoid'
import { SendToDB } from "../http/tableApi"
import { createDir } from "../http/cloudApi"
import { PageAfterUpload } from "../components/web/PageAfterUpload"
import { NavBar } from "../components/web/NavBar"
import { useSelector } from "react-redux";
import Footer from "../components/admin/Footer"

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
            type: 'фотографии',
            format: '10x15',
            paper: 'глянец',
            files: []
        }
    ])

    //console.log(formats)

    const AddFormat = () =>{
        setFormats([...formats, {
            id: uuidv4(),
            type: 'фотографии',
            format: '10x15',
            paper: 'глянец',
            files: []
        }])
    }

    const DeleteFormat = (el) =>{
        setFormats([...formats.filter(one=>one!==el)])
    }

    const [amountPhoto, setAmountPhoto] = useState(0)
    const [current, setCurrent] = useState(0)

    const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');

    const upload = async() =>{
        const photo = formats.reduce((acc,el)=> {
            const ff =() =>{
                switch(el.type){
                    case 'фото': return 'фото'
                    case 'холст': return 'холст'
                    case 'магнит': return 'магнит'
                    default: return 'фото'
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
            "other":other,
            "photo": photo, 
            "nikname": typeAnswer +': '+nikname,
            "price": 0,
            "codeInside": nanoid(6),
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
            const parentFile = await createDir(formatOne.format, MainDir.id);

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
        <div style={{background: 'linear-gradient(45deg, rgb(109, 146, 143), rgb(190, 195, 149))', minHeight: '100vh'}}>
                <NavBar />
                <Row className="justify-content-center">
                <Col md={10}>
                    
                   

                    {current===0
                    ?
                    <>
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
                    
                </Col>
                </Row>
            
            <Footer />
        </div>
    )
}

export default Web

