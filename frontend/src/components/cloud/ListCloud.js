import { useSelector } from "react-redux"
import { ListRow } from "./ListRow"
import _ from 'lodash'
import style from './ListCloud.module.css'
import { Fragment } from "react"


export const ListCloud=() =>{

    const files = _.orderBy(useSelector(state=>state.files.files), 'createdAt', 'desc')
     
    return(
        <>
            <div className={style.menu}>Файлов: {files.length}</div>

            <div className={style.filesList}>
                {files.map((el, index) => {
                    const date = el.createdAt ? new Date(el.createdAt).toLocaleDateString('ru-RU') : '';
                    const prevDate = index > 0 && files[index - 1].createdAt 
                    ? new Date(files[index - 1].createdAt).toLocaleDateString('ru-RU') 
                    : '';
                    
                    return (
                    <Fragment key={index}>
                        {(index === 0 || date !== prevDate) && (
                        <div className={style.dateDivider}>
                        {new Date(el.createdAt).toLocaleDateString('ru-RU', { 
                            
                            day: 'numeric', 
                            month: 'long', 
                            weekday: 'long'
                        })}
                        </div>
                        )}
                        <ListRow el={el} />
                    </Fragment>
                    );
                })}
            </div>
        
        </>
        
    )
}