import { useState } from "react"
import { NavBar } from "../components/admin/NavBar"
import {Row, Col, Button, ProgressBar, Modal, Tooltip, OverlayTrigger} from 'react-bootstrap'
import { uploadFiles } from "../http/cloudApi"
import { ContactForm } from "../components/web/ContactForm"
import { OtherForm } from "../components/web/OtherForm"
import { FilesForm } from "../components/web/FilesForm"
import { v4 as uuidv4 } from 'uuid'
import {nanoid} from 'nanoid'
import { SendToDB } from "../http/tableApi"
import { createDir } from "../http/cloudApi"
import { NavBarForm } from "../components/web/NavBarForm"

const Web = () =>{

    const [progress, setProgress] = useState(0)  
    const [showModal, setShowModal] = useState(false);  

    const [name, setName] = useState('')
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
            paper: 'glossy',
            files: []
        }
    ])

    //console.log(formats)

    const AddFormat = () =>{
        setFormats([...formats, {
            id: uuidv4(),
            type: 'фотографии',
            format: '10x15',
            paper: 'glossy',
            files: []
        }])
    }

    const DeleteFormat = (el) =>{
        setFormats([...formats.filter(one=>one!==el)])
    }

    const [amountPhoto, setAmountPhoto] = useState(0)
    const [current, setCurrent] = useState(0)
    const upload = async() =>{
        setShowModal(true);
        const photo = formats.reduce((acc,el)=> {
            const ff =() =>{
                switch(el.type){
                    case 'фотографии': return 'photo'
                    case 'холсты': return 'holst'
                    case 'магниты': return 'magnit'
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
            "name": name,
            "phone": phone,
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
            "raion": ''
        }
        
        const user = await SendToDB(data)

        const MainDir = await createDir(typePost+(user.order.id%99+1))
        
        formats.forEach(async (formatOne) => {
            const parentFile = await createDir(formatOne.format, MainDir.id);

            formatOne.files.forEach(async (file, index) => {
              
              await uploadFiles(file, parentFile.id, setProgress)
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
        <div style={{background: 'linear-gradient(45deg, rgb(109, 146, 143), rgb(190, 195, 149))'}}>

            {/*<NavBar />*/}
                

                <Row className="justify-content-center">
                    <Col md={10}>
                        
                        <NavBarForm />
                        
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
                        {/*<FileUpload />*/}

                        <ContactForm 
                            name={name} setName={setName}
                            phone={phone} setPhone={setPhone}
                            typePost={typePost} setTypePost={setTypePost}
                            city={city} setCity={setCity}
                            adress={adress} setAdress={setAdress}
                            postCode={postCode} setPostCode={setPostCode}
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
                        
                    </Col>
                </Row>

                  <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    {current===amountPhoto ? 
                    <>
                    <Modal.Header closeButton>
                        <Modal.Title>Заказ принят!</Modal.Title>
                    </Modal.Header>
                        
                    <Modal.Body>
                        <Row>
                            <Col className="mt-3">
                                <h5 style={{color: 'green'}}>Загружено {amountPhoto} фото.</h5>
                            </Col>
                            <Col className="d-flex justify-content-end mt-3">
                            <Button variant="success" onClick={()=>setShowModal(false)}>закрыть</Button>
                            </Col>
                        </Row>
                    </Modal.Body>
                    </>
                    :
                    <>
                    <Modal.Header closeButton>
                        <Modal.Title>Идет оформление заказа...</Modal.Title>
                    </Modal.Header>
                    
                    <Modal.Body>
                        <ProgressBar animated now={100} label={`Загружено фото: ${current} из ${amountPhoto}`} />
                        <h6>Не закрывайте и не обновляйте страницу до окончания загрузки!</h6>
                    </Modal.Body>
                    
                    </> }   
                </Modal>
            


        </div>
    )
}

export default Web

