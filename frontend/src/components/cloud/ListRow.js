import {useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { deleteFile, downloadFiles, displayFileImg } from '../../http/cloudApi'
import { deleteFileStore, pushStack, setCurrentDir, addStack } from '../../store/fileReducer'
import './styleCloud.css'

export const ListRow = ({el}) =>{
    const dispatch = useDispatch()
    const currentDir = useSelector(state=>state.files.currentDir)
    const [isDownload, setisDownload] = useState(false)
    const [loadingCount, setLoadingCount] = useState(0)

    const [thumb, setThumb] = useState('')


    useEffect(() => {
        const displayFile = async (fileId) => {
            try {
                const data = await displayFileImg(fileId)
                setThumb(data);
            } catch (error) {
                console.error('Error fetching the image:', error);
            }
        };

        if (el.type !== 'dir') {
            displayFile(el.id);
        }
    }, [el]);


   
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
        <div className='block-file no-select' onClick ={(el.type==='dir')?()=>openFile():null}>
            <div className='file-name'>{el.name}</div>
            <div className='image-container'>
                    {  
                    isDownload? <div style={{fontSize: 20, textAlign: 'center'}}><i className="bi bi-cloud-download icon-menu"></i> {loadingCount}%</div>:
                    el.type==='dir'?
                        <i className="bi bi-folder icon-menu"></i> 
                    :
                    <>
                        {thumb ? 
                            <img className='imageFull' src={thumb} alt="Loaded from server" /> 
                        : 
                            <p>загрузка</p>
                        }
                    </>
                    
                    }
            </div>
            <div className='button-group1'>
                <button onClick={(e)=>downloadFile(e)}>скачать / {el.type === 'dir' 
                    ? ( calculateFolderSize(el) / 1024 / 1024).toFixed(2)
                    : (el.size / 1024 / 1024).toFixed(2)
                }мб</button>
                <button onClick={(e)=>deleteFileClick(e)}><i className="bi bi-x-lg"></i></button>
            </div>
        </div>
    )
}