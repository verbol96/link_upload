import { useState } from "react"
import { NavBar } from "../components/admin/NavBar"
import {Row, Col, Button, FormCheck, Card, ProgressBar, Modal} from 'react-bootstrap'
import { uploadFiles } from "../http/cloudApi"
import { ContactForm } from "../components/web/ContactForm"
import { OtherForm } from "../components/web/OtherForm"
import { FilesForm } from "../components/web/FilesForm"
import { v4 as uuidv4 } from 'uuid'
import {nanoid} from 'nanoid'
import { SendToDB } from "../http/tableApi"
import { createDir } from "../http/cloudApi"
//import { changeProgress } from "../store/fileReducer"

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
              setCurrent(index);
              await uploadFiles(file, parentFile.id, setProgress);
            });
          });
    }
  
    return (
        <div>
            <NavBar />

            <Row className="justify-content-center mt-3">
                <Col md={2}><h2>Форма заказа</h2></Col>
            </Row>
                <Row className="justify-content-center mt-3">
                    <Col md={10}>
                        <ContactForm 
                            name={name} setName={setName}
                            phone={phone} setPhone={setPhone}
                            typePost={typePost} setTypePost={setTypePost}
                            city={city} setCity={setCity}
                            adress={adress} setAdress={setAdress}
                            postCode={postCode} setPostCode={setPostCode}
                            />

                        <Card className='p-3 mt-3'>
                            {formats.map((el,index)=><FilesForm key={el.id} index={index} el={el} DeleteFormat={DeleteFormat}
                                                        formats={formats} setFormats={setFormats} />)}
                            <Row>
                                <Col md={2} className='mt-4'>
                                    <Button variant='success' onClick={()=>AddFormat()}>+ другой формат</Button>
                                </Col>
                            </Row>
                        </Card>   
                        {/*<FileUpload />*/}
                        
                        <OtherForm other={other} setOther={setOther} 
                            typeAnswer={typeAnswer} setTypeAnswer={setTypeAnswer}
                            nikname={nikname} setNikname={setNikname} />

                        <Row className="m-5">
                            <Col md={1}> <FormCheck /></Col>
                            <Col md={6}>
                                <p style={{fontSize: 12}}>подтверждаю, что ознакомлен с правилами заказа и данные указаны верно</p>
                            </Col>
                            <Col md={{span: 2, offset: 3}}>
                                <Button variant="success" onClick={()=>upload()}>Оформить заказ!</Button>
                            </Col>
                        </Row>
                        
                    </Col>
                </Row>

                  <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    <Modal.Header closeButton>
                    <Modal.Title>Оформление заказа...</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                    <h6>
                        Загружено фото: {current + 1} из {amountPhoto}
                    </h6>
                    <ProgressBar now={progress} label={`${progress}%`} />

                    {current+1===amountPhoto ? 
                    <Row>
                        <Col className="mt-3">
                            <h5 style={{color: 'green'}}>Заказ отправлен!</h5>
                        </Col>
                        <Col className="d-flex justify-content-end mt-3">
                        <Button variant="success" onClick={()=>setShowModal(false)}>закрыть</Button>
                        </Col>
                    </Row>
                    
                    : null}
                    </Modal.Body>
                </Modal>
            


        </div>
    )
}

export default Web

