import {useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { deleteFile, downloadFiles } from '../../http/cloudApi'
import { deleteFileStore, pushStack, setCurrentDir, addStack } from '../../store/fileReducer'
import './styleCloud.css'

export const ListRow = ({el}) =>{
    const dispatch = useDispatch()
    const currentDir = useSelector(state=>state.files.currentDir)
    const [isDownload, setisDownload] = useState(false)
    const [loadingCount, setLoadingCount] = useState(0)
   
    const openFile = () =>{
        dispatch(pushStack(currentDir))
        dispatch(setCurrentDir(el.id))
        dispatch(addStack(el.name))
    }

    const deleteFileClick = async(e) => {
        e.stopPropagation()
    
        const confirmation = window.confirm('Вы уверены, что хотите удалить этот файл?')
        
        if (confirmation) {
            await deleteFile(el)
            dispatch(deleteFileStore(el.id))
            alert('Файл удален')
        } 
    }

    const downloadFile = async(e)=>{
        setisDownload(true)
        e.stopPropagation();
        
        await downloadFiles(el, (progress) => {
            setLoadingCount(progress)
            
        });
        setLoadingCount(0)
        setisDownload(false)
        
    }

    const files = useSelector(state=>state.files.filesAll)
    const calculateFolderSize = (el) =>{
        let path
        if(el.path) path =  el.path+'/'+el.name
        else path = el.name
        return files.reduce((acc, file) => {
            return file.path.includes(path) ? acc + file.size : acc;
        }, 0);
    }

    return(
        <div className='block-file' onClick={(el.type==='dir')?()=>openFile():null}>
        <div className='file-info'>
            <span style={{fontSize: 13}} className='file-name'>{el.name}</span>
            <div className='icon-container'>
                {   isDownload? <span style={{fontSize: 13}}><i style={{color: 'Teal', fontSize: '18px'}} className="bi bi-cloud-download"></i> {loadingCount}%</span>:
                    el.type==='dir'?
                    <i style={{color: 'Teal'}} className="bi bi-folder"></i> 
                    :
                    <i style={{color: 'Teal'}} className="bi bi-image-fill"></i> 
                }
            </div>
            <div className='file-size'>
            {el.type === 'dir' 
                ? ( calculateFolderSize(el) / 1024 / 1024).toFixed(2)
                : (el.size / 1024 / 1024).toFixed(2)
            }
            мб
            </div>
            <span  style={{fontSize: 9}} className='file-date'>{el.createdAt.slice(0,10)}</span>
            <div className='file-button'>
                <span><button onClick={(e)=>downloadFile(e)}><i style={{color: 'Teal', fontSize: '19px'}} className="bi bi-cloud-arrow-down"></i></button></span>
                <span><button onClick={(e)=>deleteFileClick(e)}><i style={{color: 'LightCoral', fontSize: '16px'}} className="bi bi-x-lg"></i></button></span>
            </div>
        </div>
        </div>
    )
}