//import { useState } from "react"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { ListCloud } from "../components/cloud/ListCloud"
import { NavBar } from "../components/admin/NavBar"
import {getFiles} from '../http/cloudApi'
import {setFiles, setCurrentDir} from '../store/fileReducer'
import { Row, Button, Col} from 'react-bootstrap'


const Cloud = () =>{
    const dispatch = useDispatch()
    const currentDir = useSelector(state=>state.files.currentDir)
    const stackDir = useSelector(state=>state.files.stackDir)

    useEffect(()=>{
        async function getFile (){
            let value = await getFiles(currentDir)
            dispatch(setFiles(value))
        }
        getFile()
        
    },[currentDir, dispatch])

    const BackClick = () =>{
        const backDir = stackDir.pop()
        dispatch(setCurrentDir(backDir))
    }
    
    return (
        <div>
            <NavBar />
            <Row className="m-2">
                <Col md={2}>
                    <Button variant="dark" size="sm" onClick={currentDir?()=>BackClick():null}>Назад</Button>
                </Col>

            </Row>

            <ListCloud />

        </div>
    )
}

export default Cloud

