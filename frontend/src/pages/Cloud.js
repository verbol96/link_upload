//import { useState } from "react"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { ListCloud } from "../components/cloud/ListCloud"
import {deleteFile, getFiles, getFilesAll} from '../http/cloudApi'
import {setFiles, setCurrentDir, setFilesAll, delStack, deleteFileStore} from '../store/fileReducer'
import Footer from "../components/admin/Footer";
import { NavBar } from "../components/admin/NavBar"

 
const Cloud = () =>{
    const dispatch = useDispatch()
    const currentDir = useSelector(state=>state.files.currentDir)
    const stackDir = useSelector(state=>state.files.stackDir)
    const stack = useSelector(state=>state.files.stack)
    const filesAll = useSelector(state=>state.files.filesAll)
    const files = useSelector(state=>state.files.files)

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

    const getTotalSize = (files) => files.reduce((total, file) => total + file.size, 0) / (1024 * 1024 * 1024);

    /* функция для удаления всех
    const ClearCloud = async() =>{
        if (window.confirm('Вы уверены, что хотите удалить файлы?')) {
            const data = await deleteFileAll()
            alert(data.message)
        }
    }*/

    const isDateOlderThan14Days = (dateString) => {
        const currentDate = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(currentDate.getDate() - 14);
        const date = new Date(dateString);
        return date < thirtyDaysAgo;
    }

    const deleteFileClick = async(el) => {
        await deleteFile(el.id)
        dispatch(deleteFileStore(el.id))
    }

    useEffect(() => {
        console.log('yes')
        const ClearCloud = async () => {
          if (files.length > 0) {
            const oldFiles = files.filter(el => isDateOlderThan14Days(el.createdAt));
            console.log('yes1')
            if (oldFiles.length > 0) {
                for (const el of oldFiles) {
                  try {
                    await deleteFileClick(el);
                  } catch (error) {
                    console.error(`Ошибка при удалении файла ${el.name}:`, error);
                  }
                }
            }
          }
        };
      
        ClearCloud();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

    return (
        <div style={{display: 'flex', flexDirection: 'column',background: '#e8e8e8', minHeight: '100vh'}}>
            <NavBar />
            <div className="cloud-menu"> 
                <div>
                    <button style={{border: '1px solid #dbdbdb', borderRadius: 5, background: 'white', width: '40px'}} onClick={currentDir?()=>BackClick():null}>
                        <i style={{color: 'black'}} className="bi bi-arrow-left"></i>
                    </button>
                </div>
                <div className="cloud-menu-path">
                    Облако LINK{stack.map((el, index)=><span key={index}><i className="bi bi-chevron-right"></i> {el} </span>)}
                </div>
                <div className="cloud-menu-right">
                    <h6 style={{fontSize: 14}}>{`Память: ${getTotalSize(filesAll).toFixed(2)}gb / 60gb`}</h6>
                    
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

