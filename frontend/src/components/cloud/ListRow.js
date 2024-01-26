import {useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { deleteFile, downloadFiles, displayFileImg } from '../../http/cloudApi'
import { deleteFileStore, pushStack, setCurrentDir, addStack } from '../../store/fileReducer'
import style from './ListRow.module.css'

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
            await deleteFile(el.id)
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

    const ShowData = () =>{
        const [data, time] = el.createdAt.split('T')
        return `${data.split('-')[2]}.${data.split('-')[1]} (${time.split(':')[0]}:${time.split(':')[1]})`
    }
    
    return(
        <div className={style.blockFile} onClick ={(el.type==='dir')?()=>openFile():null}>
            <div className={style.fileName}>
                <div>{el.name}</div>
                {el.type==='dir'&&<div>{ShowData()}</div> }
            </div>
            
            <div className={style.imageContainer}>
                    {   
                    isDownload? <div style={{fontSize: 20, textAlign: 'center'}}><i className="bi bi-cloud-download icon-menu"></i> {loadingCount}%</div>:
                    el.type==='dir'?
                        <div className={style.iconMenu} >
                            <span className="bi bi-folder"></span> 
                        </div>
                    :
                    <>
                        {thumb ? 
                            <img className={style.imageFull} src={thumb} alt="Loaded from server" /> 
                        : 
                            <p>загрузка</p>
                        }
                    </>
                    
                    }
            </div>
            <div className={style.buttonGroup1}>
                <button className={style.buttonSize} onClick={(e)=>downloadFile(e)}>
                    <i className="bi bi-cloud-arrow-up"></i>  {el.type === 'dir' 
                    ? ( calculateFolderSize(el) / 1024 / 1024).toFixed(2)
                    : (el.size / 1024 / 1024).toFixed(2)
                    }мб
                </button>
                <button className={style.buttonDelete} onClick={(e)=>deleteFileClick(e)}><i className="bi bi-x-lg"></i></button>
            </div>
        </div>
    )
}