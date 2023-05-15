
import { Col, Row } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { deleteFile, downloadFiles } from '../../http/cloudApi'
import { deleteFileStore, pushStack, setCurrentDir } from '../../store/fileReducer'
import './styleCloud.css'

export const ListRow = ({el}) =>{
    const dispatch = useDispatch()
    const currentDir = useSelector(state=>state.files.currentDir)
   
    const openFile = () =>{
        dispatch(pushStack(currentDir))
        dispatch(setCurrentDir(el.id))
    }

    const deleteFileClick = async(e) =>{
        e.stopPropagation()
        await deleteFile(el)
        dispatch(deleteFileStore(el.id))
        alert('файл удален ')
    }

    const downloadFile = async(e)=>{
        e.stopPropagation()
        await downloadFiles(el)
        alert('скачено ')
    }

    return(
        <div className='listRow' onClick={(el.type==='dir')?()=>openFile():null}>
            <Row className='justify-content-center'>
                <Col md={1}>{el.id}</Col>
                {el.type==='dir'?
                <Col md={4}><i className="bi bi-folder"></i> {el.name}</Col>
                :
                <Col md={4}><i className="bi bi-image-fill"></i> {el.name}</Col>
                }
                
                <Col md={1}>{el.type}</Col>
                <Col md={2}>{el.size}</Col>
                <Col md={2}> {el.createdAt.slice(0,10)}</Col>
                <Col md={1} onClick={(e)=>downloadFile(e)}><i className="bi bi-cloud-arrow-down"></i></Col>
                <Col md={1} onClick={(e)=>deleteFileClick(e)}><i className="bi bi-trash3"></i></Col>
            </Row>
            
        </div>
    )
}