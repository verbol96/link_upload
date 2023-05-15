import { useState } from "react"
import { NavBar } from "../componentsAdmin.js/NavBar"
import {Row, Col, Card, FormControl, Button} from 'react-bootstrap'
import { v4 as uuidv4 } from 'uuid'
import { ImgCard } from "../components/web/ImgCard"
import { uploadFiles } from "../http/cloudApi"
import { addFile } from "../store/fileReducer"
import { useDispatch } from "react-redux"

const Web = () =>{

    const dispatch = useDispatch()
    const [fileList, setFileList] = useState([])
    const [files, setFiles] = useState([])
  const file = (e) =>{

    const arr = Array.from(e.target.files)
    setFiles(arr)
    arr.forEach(el=>{

      const reader = new FileReader()

      reader.onload = (ev) =>{
        setFileList((prev)=>{
          return [
            ...prev,{
              id: uuidv4(),
              imageUrl: reader.result,
              file
            }
            
          ]
        })
      }
      reader.readAsDataURL(el)
    }) 
  }

  const deleteImg = (value) =>{
    setFileList((prev)=>{
        return prev.filter(el=>el.id!==value)
    })
   }

    const upload = () =>{
        //console.log(files)
        files.forEach(async file=>{
            let value = await uploadFiles(file)
            dispatch(addFile(value))
        }
        )
    }
  
    return (
        <div>
            <NavBar />
            
            <Row className="justify-content-center mt-3">
                <Col md={2}><h2>Форма заказа</h2></Col>
            </Row>

            <Row className="justify-content-center mt-3">
                <Col md={10}>
                    <Card className="p-5">
                        <Row className="mt-2">
                            <Col md={3}>
                                <h6>Телефон:</h6>
                            </Col>
                            <Col>
                                <FormControl size="sm" />
                            </Col>
                        </Row>
                        <Row className="mt-2">
                            <Col md={3}>
                                <h6>ФИО:</h6>
                            </Col>
                            <Col>
                                <FormControl size="sm" />
                            </Col>
                        </Row>
                        <Row className="mt-2">
                            <Col md={3}>
                                <h6>Адрес:</h6>
                            </Col>
                            <Col>
                                <FormControl size="sm" />
                            </Col>
                        </Row>
                        
                    </Card>

                    <Card className="p-5 mt-3">
                        <Row>
                            <FormControl type="file" multiple={true}  onChange={(e)=>file(e)} />
                        </Row>
                        <Row>
                            <div  style={{display: 'flex', flexWrap: "wrap"}}>
                                {fileList.map((el)=> <ImgCard image={el} key={el.id} deleteImg={deleteImg} /> )}
                            </div>
                        </Row>
                    </Card>
                        
                    <Row className="justify-content-center mt-5">
                        <Col md={2}>
                            <Button variant="secondary" onClick={()=>upload()}>Оформить заказ!</Button>
                        </Col>
                    </Row>
                    
                </Col>
            </Row>


        </div>
    )
}

export default Web

