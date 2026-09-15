import { useEffect, useState } from 'react'
import style from './Files.module.css'
import { v4 as uuidv4 } from 'uuid'
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
               <div className="w-full max-w-xl mx-auto mt-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="relative w-20 h-20 mx-auto mb-5">
                            {/* Пульсирующие круги */}
                            <span className="absolute inset-2 rounded-full bg-teal-900/10 "></span>
                            <span className="absolute inset-0 flex items-center justify-center">
                                <i className="bi bi-images text-2xl text-teal-800"></i>
                            </span>
                        </div>

                        <h3 className="text-base font-semibold text-gray-800 mb-2">Раздел в разработке</h3>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
                            Здесь вы сможете загружать фото частями, с разных устройств
                            и в течение нескольких дней — перед отправкой заказа на печать.
                        </p>

                        <div className="mt-6 flex items-center justify-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                </div>
            }
            
        </div>
    )
}