import { getCopyBD, setCopyBD } from "../../http/dbApi"
import { useState } from "react"
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'

const OtherSettings = () =>{

    const [fileBD, setFileBD] = useState([])

    const handleFileChange = async(e) => {
        const file = e.target.files[0];
        if (file) {
            const text = await file.text(); // ← читаем как текст
            const data = JSON.parse(text);  // ← преобразуем в объект
            setFileBD(data)
            //console.log(data);              // ← выводим в консоль
        }
    };

   const saveDB =async() =>{
        await getCopyBD()
   }

    return (
        <div style={{marginLeft: 50, marginTop: 30}}> 
            <div  style={{padding: 10}}>
                <Button variant='outline' size='lg' onClick={()=>saveDB()}>
                     <i style={{color: 'black', fontSize: 25}} className="bi bi-database-fill-down"></i> Скачать копию БД
                </Button>
            </div>

            <div style={{marginTop: 50, display: 'flex', flexDirection:'column', gap: 15}}>
                <div>
                    <label>загрузить БД:</label>
                </div>
                <div>
                    <Input 
                        type="file" 
                        accept=".json"
                        onChange={handleFileChange}
                        style={{
                            maxWidth: '400px',
                            width: '100%' /* чтобы не был шире 100px */
                        }}
                    />
                </div>
                <div>
                    <Button onClick={()=>setCopyBD(fileBD)}>обновить БД</Button>
                </div>
            </div>
        </div>
    )
}

export default OtherSettings

