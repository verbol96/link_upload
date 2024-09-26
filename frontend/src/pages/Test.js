import { useEffect, useState, useRef } from "react";
import Footer from "../components/admin/Footer";
import { NavBar } from '../components/admin/NavBar';
import Papa from 'papaparse';
import { Button } from "../ui/button";

const Test = () => {

  const [data, setData] = useState([]);

  const handleFileChange = (e) => {
    const file = (e.target.files[0]);

    if (file) {
      Papa.parse(file, {
        header: true, // Указывает, что первая строка — это заголовки
        skipEmptyLines: true, // Пропуск пустых строк
        complete: (result) => {
          setData(result.data); // Установка JSON данных в state
        },
        error: (error) => {
          console.error('Ошибка при обработке CSV:', error);
        }
      });
    }
  };


 const getData = (el) =>{
    const idPcho = el["ТРЕК-НОМЕР ПЧО"];
    return idPcho
 }

 const changeStatus = async() =>{
        
 }
  

    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <NavBar />
            
            <div>
                <input type="file" accept=".csv" onChange={handleFileChange} />

            </div>
            <div>
              <Button onClick={()=>changeStatus()}>отметить</Button>

              {/* Пример отображения данных */}
              <div>
                {
                  data.map((el,index)=><div key={index}>{getData(el)}</div>)
                }
              </div>
            </div>
            
                
            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    )
}

export default Test;