import { useEffect, useRef, useState } from 'react'
import style from './Files.module.css'
import { v4 as uuidv4 } from 'uuid'
import { useDispatch, useSelector } from 'react-redux'
import { getSettings } from '../../http/dbApi'
import { saveSettings } from '../../store/orderReducer'
import { OneFormat } from './MyFiles/OneFormat'
import { createDir, uploadFiles } from '../../http/cloudApi'

export const MyFiles = () =>{

    const [isStart, setIsStart] = useState(false)
    const [formats, setFormats] = useState([
        {
            id: uuidv4(),
            type: 'photo',
            format: 'а6',
            paper: 'glossy',
            copies: 1,
            files: []
        }
    ])
    const [indexItem, setIndexItem] = useState(0)
    
    useEffect(()=>{
        if(formats.length<1) setIsStart(false)
    },[formats])

    const addFormat = () =>{
        setFormats(prev=>[...prev, {
            id: uuidv4(),
            type: 'photo',
            format: 'а6',
            paper: 'glossy',
            copies: 1,
            files: []
        }])

        setIndexItem(formats.length)
    }

    const deleteFormat = (id) =>{
        const alert = window.confirm('Удалить формат?')

        if(alert){
            const newFormats = formats.filter(el=>el.id!==id)
            setFormats(newFormats)
        }
    }

    const upload = async() =>{
        const MainDir = await createDir('test')
        for (let formatOne of formats) {
            const parentFile = await createDir(formatOne.format + '_' + formatOne.paper + '_копий_' +formatOne.copies, MainDir.id);

            const uploadPromises = formatOne.files.map(async (file) => {
                await uploadFiles(file, parentFile.id, formatOne.id);
                
            });
        
            await Promise.all(uploadPromises);
        }
    }
console.log(formats)
    return(
        <div className={style.container}>
            
            {isStart ?
                <>
                     <div className={style.menuFormats}>
                        {
                        formats.map((el, index)=> 
                            <div key={el.id} onClick={()=>setIndexItem(index)} style={{background: index===indexItem && 'silver'}}>
                                {el.format} <span onClick={()=>deleteFormat(el.id)} style={{color: 'red'}}>X</span>
                            </div>)
                        }
                        <div>
                            <button onClick={()=>addFormat()}>добавить новый формат</button>
                        </div>
                    </div>
                    
                    <OneFormat formats={formats} setFormats={setFormats} indexItem={indexItem} />

                    <div>
                        <button onClick={()=>upload()}>upload</button>
                    </div>
                </>:
                <>
                    <div>Здесь вы можете загружать фото частями несколько дней и с разных устройств перед отправкой заказа на печать. </div>
                    <div>
                        <button onClick={()=>setIsStart(true)}>Начать загрузку файлов</button>
                    </div>
                </>
            }
            
        </div>
    )
}