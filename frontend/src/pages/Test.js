import { useEffect, useState, useRef } from "react";
import Footer from "../components/admin/Footer";
import { NavBar } from '../components/admin/NavBar';
import axios from "axios";
import { $host } from "../http";
import style from './Test.module.css'

const Test = () => {

    const [inputOPS, setInputOPS] = useState('')
    const [listOps, setListObs] = useState([])
    const [nameOPS, setNameOPS] = useState('')
    const [phone, setPhone] = useState('')
    const [FIO, setFIO] = useState('')

    useEffect(()=>{
        const getListOps = async () => {
            try {
              const {data} = await $host.get('/api/ep/getListOps');
              setListObs(data.Table)
            } catch (error) {
              console.error('Ошибка при получении JWT:', error);
            }
          };

        getListOps()
    },[])
    
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef  = useRef(null)
  
    useEffect(() => {
      function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    useEffect(()=>{
        if (isOpen) {
            // Если dropdown открыт, устанавливаем фокус на input
            inputRef.current.focus();
          }
    }, [isOpen])
    

      const filterOPS = listOps.filter(el=>{
        
        return el.WarehouseName.toLowerCase().includes(inputOPS.toLowerCase())
      })

      const putNameOPS =(name)=>{
        console.log(name)
        setNameOPS(name.WarehouseName)
        setIsOpen(false)
      }

      const getInfo = () =>{
        const getInfo1 = async () => {
            try {
              const {data} = await $host.get('/api/ep/getInfo');
              console.log(data)
            } catch (error) {
              console.error('Ошибка при получении JWT:', error);
            }
          };

        getInfo1()
      }

    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <NavBar />
            
            <div style={{display: 'flex', justifyContent: 'center', color: '#116466', margin: 20, fontSize: 25}}>Tестирование API</div>
        
            <div className={style.main}>
                <div className={style.title}>Отделение получения:</div>

                <div className={style.inputBlock} ref={dropdownRef}>
                    <button onClick={() => setIsOpen(!isOpen)}>{nameOPS}</button>
                    {isOpen && (
                        <div className={style.inputBlockDetails}>
                        <input ref={inputRef} value={inputOPS} onChange={(e)=>setInputOPS(e.target.value)} />
                    
                        {filterOPS.map((el,index)=><div key={index} onClick={()=>putNameOPS(el)}>
                            {el.WarehouseName}
                        </div>)}
                    
                        </div>
                    )}
                </div>
            </div>

            <div className={style.main}>
                <div className={style.title}>Номер получателя:</div>

                <div className={style.input}>
                    <input value={phone} onChange={(e)=>setPhone(e.target.value)} />
            
                </div>
            </div>

            <div className={style.main}>
                <div className={style.title}>ФИО получателя:</div>

                <div className={style.input}>
                    <input value={FIO} onChange={(e)=>setFIO(e.target.value)} />
            
                </div>
            </div>

            <div>
                <button onClick={()=>getInfo()}>getInfo</button>
            </div>
            
                
            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    )
}

export default Test;