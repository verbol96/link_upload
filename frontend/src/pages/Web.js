import { useState } from "react"
import { NavBar } from "../components/admin/NavBar"
import {Row, Col, Button, FormCheck, Card} from 'react-bootstrap'
//import { uploadFiles } from "../http/cloudApi"
//import { addFile } from "../store/fileReducer"
//import { useDispatch } from "react-redux"
import { ContactForm } from "../components/web/ContactForm"
import { OtherForm } from "../components/web/OtherForm"
import { FilesForm } from "../components/web/FilesForm"
import { v4 as uuidv4 } from 'uuid'
import {nanoid} from 'nanoid'
import { SendToDB } from "../http/tableApi"

const Web = () =>{

    //const dispatch = useDispatch()

    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [typePost, setTypePost] = useState('E')
    const [city, setCity] = useState('')
    const [adress, setAdress] = useState('')
    const [postCode, setPostCode] = useState('')
    const [other, setOther] =useState('')
    const [typeAnswer, setTypeAnswer] = useState('instargram')
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

    const upload = async() =>{
        //console.log(files)

        const data = {
            "name": name,
            "phone": phone,
            "typePost": typePost,
            "city": city,
            "adress": adress,
            "postCode": postCode,
            "other":other,

            "photo": [], 
            "nikname": typeAnswer+nikname,
            "price": 0,
            "codeInside": nanoid(6),
            "codeOutside": '',
            "oblast": '',
            "raion": ''
        }

        const order = await SendToDB(data)

        console.log(order)
        /*files.forEach(async file=>{
            let value = await uploadFiles(file)
            dispatch(addFile(value))
        }
        )*/
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


        </div>
    )
}

export default Web

