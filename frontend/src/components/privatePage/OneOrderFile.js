import { useEffect, useState } from "react"
import { displayFileImg, getFilesPhotosId } from "../../http/cloudApi"
import style from './OneOrderFile.module.css'

export const OneOrderFile = ({el, status, PriceList, settings}) =>{

    const [thumb, setThumb] = useState([])
    const [imgDownload, setImgDownload] = useState(0)
    const [isShow, setIsShow] = useState(false)

    useEffect(()=>{
        const getFiles =async(id)=>{
            const data = await getFilesPhotosId(id)
            try {
                for (const item of data) {
                  const response = await displayFileImg(item.id);
                  setThumb(prev=>[...prev, response])
                }

                const ImgDownload = data.reduce((acc, current) => {
                    if (current.size > 0) {
                      return acc + 1;
                    }
                    return acc; // Добавлен возврат значения вне условного оператора
                  }, 0);

                setImgDownload(ImgDownload)
                setIsShow(true)

              } catch (error) {
                console.error(error);
              }
        }
        getFiles(el.id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    
    return(
        <div className={style.container}>
            <div className={style.rowMenu}>
                {el.type!=='photo' && <div className={style.typeButton}>{el.type==='holst'? 'холст' : 'магнит'}</div>}
                <div className={style.typeButton}>{settings.find(s => s.title === el.format)?.name || 'not found'}</div>
                {el.type==='photo' && <div className={style.typeButton}>{el.paper==='glossy'? 'глянец' : 'люстр'}</div>}
                <div className={style.typeButton}>{el.amount}шт </div>
                <div className={style.typeButton}>копий: {el.copies}</div>
                <div>сумма: {(PriceList(el.format)*el.amount).toFixed(2)}</div>
            </div>

            {status===0 &&
                (isShow ?
                    <div className={style.rowMenu}>
                        {imgDownload === el.amount?
                        <div style={{marginLeft: 10}}> <i className="bi bi-check-lg"></i> загружено {el.amount} фото</div>
                        :
                        <div style={{marginLeft: 10, color: 'red'}}> нам пришло: {imgDownload} из {el.amount} фото. Попробуйте загрузить заново</div>
                        }
                    </div>
                :
                    <div className={style.rowMenu}>
                        <div style={{marginLeft: 10}}> проверка фото...</div>
                    </div>
                )
            }

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