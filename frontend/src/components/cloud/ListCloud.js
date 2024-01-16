import { useSelector } from "react-redux"
import { ListRow } from "./ListRow"
import _ from 'lodash'
import style from './ListCloud.module.css'


export const ListCloud=() =>{

    const files = _.orderBy(useSelector(state=>state.files.files), 'createdAt', 'desc')
    
    return(
        <div className={style.filesList}>

            {files.map((el,index)=><ListRow el={el} key={index} />)}
        </div>
    )
}