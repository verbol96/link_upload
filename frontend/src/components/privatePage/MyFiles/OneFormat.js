import { useState, useEffect, useRef } from "react"
import { getSettings } from "../../../http/dbApi"
import style from './OneFormat.module.css'
import { v4 as uuidv4 } from 'uuid'

export const OneFormat = ({formats, setFormats, indexItem}) =>{

    const [settings, setSettings] = useState([])

    const TypePhoto = ['photo', 'holst', 'magnit']
    const FormatPhoto = settings.filter(el=>el.type==='photo')
    const FormatHolst = settings.filter(el=>el.type==='holst')
    const FormatMagnit = settings.filter(el=>el.type==='magnit')

    const sizePhoto =(value)=>{
        switch(value){
            case 'photo': return FormatPhoto
            case 'holst': return FormatHolst
            case 'magnit': return FormatMagnit
            default: return FormatPhoto
        }
    }

    const inputFile = useRef(null)

    useEffect(()=>{
        async function getPriceList (){
            let value = await getSettings()
            setSettings(value)
        }
        getPriceList()
    },[])

    const changeCopy = (value) =>{
        setFormats(prev=>{
            let newFormats = [...prev]
            newFormats[indexItem] = {...newFormats[indexItem], copies: value}
            return newFormats
        })
    }
    const ChangeType = (value) =>{
        setFormats(prev=>{
            let newFormats = [...prev]
            newFormats[indexItem] = {...newFormats[indexItem], type: value, format: sizePhoto(value)[0].title}
            console.log(sizePhoto(value)[0].title)
            return newFormats
        })
    }
    const ChangeSize = (value) =>{
        setFormats(prev=>
        {
            let newArr = [...prev]
            newArr[indexItem] = {...newArr[indexItem], format: value}
            return newArr
        })
        
    } 

    const uploadFiles = async(e) =>{
        const filesArr = Array.from(e.target.files)

        const createObj = (file) =>{
            const obj = {
                id: uuidv4(),
                file: file
              };
              return obj;
            }
        

        for(const file of filesArr){
            const original = await createObj(file)

            setFormats(prev=>{
                let newArr = [...prev]
                newArr[indexItem] = {...newArr[indexItem], files: [...newArr[indexItem].files, original]}
                return newArr
            })
        }
        
    }



    return(
        <div className={style.files}>
            <div className={style.menuFiles}>
                <button className={style.buttonAdd} onClick={()=>inputFile.current.click()}>добавить фото</button>
                <input type='file'  style={{display: 'none'}} ref={inputFile} multiple onChange={(e)=>uploadFiles(e)} />
                
                <select value={formats[indexItem].type} onChange={(e)=>ChangeType(e.target.value)} >
                    {TypePhoto.map((el,index)=><option value={el} key={index}>{el}</option>)}
                </select>

                <select value={formats[indexItem].format} onChange={(e)=>ChangeSize(e.target.value)} >
                    {sizePhoto(formats[indexItem].type).map((el,index)=><option key={index} value={el.title}>{el.title}</option>)}
                </select>

               
                <input value={formats[indexItem].copies} onChange={(e)=>changeCopy(e.target.value)} />
                
            </div>
            <div>
                
            </div>
        </div>
    )
}