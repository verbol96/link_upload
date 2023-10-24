//import { useState } from "react"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { ListCloud } from "../components/cloud/ListCloud"
import { NavBarAdmin } from "../components/admin/NavBarAdmin"
import {getFiles, getFilesAll} from '../http/cloudApi'
import {setFiles, setCurrentDir, setFilesAll, delStack} from '../store/fileReducer'
import Footer from "../components/admin/Footer";

 
const Cloud = () =>{
    const dispatch = useDispatch()
    const currentDir = useSelector(state=>state.files.currentDir)
    const stackDir = useSelector(state=>state.files.stackDir)
    const stack = useSelector(state=>state.files.stack)

    useEffect(()=>{
        async function getFile (){
            let value = await getFiles(currentDir)
            dispatch(setFiles(value))
        }
        getFile()
        
    },[currentDir, dispatch])

    useEffect(()=>{
        async function getFileAll (){
            let value1 = await getFilesAll()
            dispatch(setFilesAll(value1))
        }
        getFileAll()
        
    },[dispatch])

    const BackClick = () =>{
        const backDir = stackDir.pop()
        dispatch(setCurrentDir(backDir))
        dispatch(delStack())
    }
    
    return (
        <div style={{display: 'flex', flexDirection: 'column',background: '#dbdbdb', minHeight: '100vh'}}>
            <NavBarAdmin />
            <div className="cloud-menu">
                <div>
                    <button style={{border: '1px solid #dbdbdb', borderRadius: 5, background: 'white', width: 50}} onClick={currentDir?()=>BackClick():null}>
                        <i style={{color: 'black'}} className="bi bi-arrow-left"></i>
                    </button>
                </div>
                <div style={{marginLeft: 60}}>
                    Облако LINK{stack.map((el, index)=><span key={index}><i className="bi bi-chevron-right"></i> {el} </span>)}
                </div>
            </div>

            <ListCloud />
            
            <div style={{marginTop: 'auto'}}>
                <Footer />
            </div>

        </div>
    )
}

export default Cloud

