import { useEffect, useState } from "react"
import { getLogUser } from "../../http/authApi"
import _ from 'lodash'

const LogsUser = () =>{

    const [logs, setLogs] = useState([])

    useEffect(()=>{
        const getData = async() =>{
            const data = await getLogUser()
            setLogs(_.orderBy(_.orderBy(data), 'createdAt', 'desc' ), 'status', 'asc' )
        }
        getData()

    },[])

    const ShowData = (dataRow) =>{

        const data = `${dataRow.split("T")[0].split("-")[2]}.${dataRow.split("T")[0].split("-")[1]}`
        const time = `${dataRow.split("T")[1].split(":")[0]}:${dataRow.split("T")[1].split(":")[1]}`
        return `${time} / ${data}`
    }

    const isMobile = (screen) =>{
        const width = Number(screen.split('x')[0])
        const hight = Number(screen.split('x')[1])
        if(width<hight) return true
        return false
    }

    return(
        <div style={{ display: 'flex', flexDirection: 'column', margin: '0 auto', width: '90vw', textAlign: 'center', marginBottom: 50}}>
        {logs.map((el, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'row', gap: 20, color: isMobile(el.screen) && 'blue' }}>
            <div style={{flex: 1}}>{ShowData(el.createdAt)}</div>
            <div style={{flex: 1}}>{el.OS}</div>
            <div style={{flex: 1}}>{el.browser}</div>
            <div style={{flex: 1}}>{el.device}</div>
            <div style={{flex: 1}}>{el.screen}</div>
          </div>
        ))}
      </div>
    )
}

export default LogsUser