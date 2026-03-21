import { getCopyBD, setCopyBD } from "../../http/dbApi"
import { useState } from "react"
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { $host } from "../../http"

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
   
   const ToLowerCase = async() =>{
        const {data} = await $host.get('api/auth/clientsToLowerCase')
        console.log(data.message)
   }

   const UpdateUsers = async() => {
        const confirmDelete = window.confirm('обновить? ');
        
        if (!confirmDelete) {
            return; // Если отмена - выходим
        }

        try {
            await $host.get('/api/auth/updateUsers');
            window.alert(" успешно обнавлено");
        } catch(error) {
            console.log('error  ');
            window.alert('Ошибка');
        }
    }
    
    const setCopyBDin = async() => {
        const confirmDelete = window.confirm('загрузить новую БД? ');
        
        if (!confirmDelete) {
            return; // Если отмена - выходим
        }

        try {
            await setCopyBD(fileBD)
            window.alert(" успешно загружено");
        } catch(error) {
            console.log('error  ');
            window.alert('Ошибка');
        }
    }

    return (
        <div className="flex flex-row gap-4  w-full p-5"> 
            <div className="flex-1 p-3 border border-gray-200 rounded-lg w-fit flex flex-col items-center gap-2">
                <label>бэкап:</label>
                <Button variant='outline' size='lg' onClick={()=>saveDB()}>
                     <i style={{color: 'black', fontSize: 25}} className="bi bi-database-fill-down"></i> Скачать копию БД
                </Button>
            </div>

            <div style={{ display: 'flex', flexDirection:'column', gap: 15}}  className="flex-1 p-3 border border-gray-200 rounded-lg w-fit  items-center ">
                <div>
                    <label>импорт БД:</label>
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
                    <Button onClick={()=>setCopyBDin()}>обновить БД</Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 p-3 border border-gray-200 rounded-lg w-fit items-center">
                <label>обновления БД:</label>
                <Button onClick={()=>ToLowerCase()}>ФИО к нижнему регистру!</Button>
                <Button onClick={()=>UpdateUsers()}>orderCount, totalOrderSum</Button>
            </div>
        </div>
    )
}

export default OtherSettings

