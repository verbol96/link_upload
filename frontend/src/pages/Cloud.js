//import { useState } from "react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { ListCloud } from "../components/cloud/ListCloud"
import { NavBar } from "../components/admin/NavBar"
import {createDir, getFiles, uploadFiles} from '../http/cloudApi'
import {setFiles, addFile, setCurrentDir} from '../store/fileReducer'
import { Row, Button, Col, Modal, FormControl, Form} from 'react-bootstrap'


const Cloud = () =>{
    const dispatch = useDispatch()
    const currentDir = useSelector(state=>state.files.currentDir)
    const stackDir = useSelector(state=>state.files.stackDir)
    //console.log(stackDir)

    useEffect(()=>{
        async function getFile (){
            let value = await getFiles(currentDir)
            //console.log(value)
            dispatch(setFiles(value))
        }
        getFile()
        
    },[currentDir, dispatch])

    const [show, setShow] = useState(false);
    const [nameFile, setNameFile] = useState('')

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const NewFolder = async()=>{
        setShow(false)
        setNameFile('')
        let value = await createDir(currentDir, nameFile)
        dispatch(addFile(value))
    } 

    const BackClick = () =>{
        const backDir = stackDir.pop()
        dispatch(setCurrentDir(backDir))
    }

    const upload = (e) =>{
        const files = [...e.target.files]
         files.forEach(async file=>{
            let value = await uploadFiles(file, currentDir)
            dispatch(addFile(value))
        }
        )
    }
    
    return (
        <div>
            <NavBar />
            <Row className="m-2">
                <Col md={1}>
                    <Button variant="dark" size="sm" onClick={currentDir?()=>BackClick():null}>Назад</Button>
                </Col>
                <Col md={2}>
                    <Button variant="secondary" size="sm" onClick={handleShow}>создать папку</Button>
                </Col>
                <Col md={3 }>
                        <Form.Control multiple={true} value='' onChange={(e)=>upload(e)} type="file" size="sm" />
                </Col>
            </Row>

            <Row>
                <Col>
                    Link Cloud - 
                    
                </Col>
            </Row>
           
            <ListCloud />

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                <Modal.Title>Создание папки</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Введите название папки:
                    <FormControl value={nameFile} onChange={(e)=>setNameFile(e.target.value)} />
                </Modal.Body>
                <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Отмена
                </Button>
                <Button variant="primary" onClick={()=>NewFolder()}>
                    Создать
                </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default Cloud

