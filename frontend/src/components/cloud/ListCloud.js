import { useSelector } from "react-redux"
import { ListRow } from "./ListRow"
import './styleCloud.css' 
import _ from 'lodash'


export const ListCloud=() =>{

    const files = _.orderBy(useSelector(state=>state.files.files), 'createdAt', 'desc')
    
    return(
        <div className="filesList">

            {files.map((el,index)=><ListRow el={el} key={index} />)}
        </div>
    )
}