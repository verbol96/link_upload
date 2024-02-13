import { useEffect, useState } from "react"
import { displayFileImg, getFilesPhotosId } from "../../http/cloudApi"
import style from './OneOrderFile.module.css'

export const OneOrderFile = ({el}) =>{

    const [thumb, setThumb] = useState([])

    useEffect(()=>{
        const getFiles =async(id)=>{
            const data = await getFilesPhotosId(id)
 
            try {
                for (const item of data) {
                  const response = await displayFileImg(item.id);
                  
                  setThumb(prev=>[...prev, response])
                }
              } catch (error) {
                console.error(error);
              }
            
        }
        
        getFiles(el.id)
    },[el])

    const ShowTitle = (value) =>{
        switch(value){
            case 'photo': return 'Фото'
            case 'holst': return 'Холст'
            case 'magnit': return 'Магнит'
            case 'glossy': return 'глянец'
            case 'lustre': return 'люстр'
            case 'а6': return '10x15 стандарт'
            case 'дд': return '10x10 квадрат'
            case 'пол': return '10х12 полароид'
            case 'мини': return '7х9 полароид'
            case 'а5': return '15х20'
            case 'а4': return '20х30'
            case '5x8': return '5х8'
            case '10x10': return '10х10'
            case '30x40': return '30x40'
            case '40x40': return '40x40'
            case '40x55': return '40x55'
            case '50x70': return '50x70'
            case '55x55': return '55x55'
            case '55x80': return '55x80s'
            case '<а6': return 'до 10х15'
            case '<а7': return 'до 7.5х10'
            case '<а5': return 'до 15х20'
            case '<а4': return 'до 20х30'
            default: return 'неизвестно'
        }
    }
 console.log(el.id)
    return(
        <div className={style.container}>
            <div className={style.rowMenu}>
                {el.type!=='photo' && <div className={style.typeButton}>{ShowTitle(el.type)}</div>}
                <div className={style.typeButton}>{ShowTitle(el.format)}</div>
                {el.type==='photo' && <div className={style.typeButton}>{ShowTitle(el.paper)}</div>}
                <div className={style.typeButton}> {el.amount}шт</div>
                <div className={style.typeButton}>копий: {el.copies}</div>
            </div>

            <div className={style.row}>

                {
                    thumb.map((el,index)=>
                        <div key={index} className={style.imageContainer}>
                            <img className={style.imageFull} src={el} alt="Loaded from server" />
                        </div>
                        
                    )
                }
            </div>

        </div>
    )
}