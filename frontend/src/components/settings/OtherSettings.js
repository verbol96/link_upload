import { getCopyBD } from "../../http/dbApi"

const OtherSettings = () =>{

   const saveDB =async() =>{
        await getCopyBD()
   }

    return (
        <div style={{marginLeft: 50, marginTop: 30}}> 
            <button style={{padding: 10}}
                    onClick={()=>saveDB()}> <i style={{color: 'black', fontSize: 25}} className="bi bi-database-fill-down"></i> Скачать копию БД</button>
        </div>
    )
}

export default OtherSettings

