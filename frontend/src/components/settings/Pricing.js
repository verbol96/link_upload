import { addSettings, deleteSetting, getSettings } from "../../http/dbApi"
import { useState, useEffect } from "react"
import '../settings/Pricing.css'
import _ from 'lodash'
import { $host } from "../../http"

export const Pricing = () =>{

    const [settings, setSettings] = useState([])

    const [type, setType] = useState('photo')
    const [title, setTitle] = useState('')
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [R, setR] = useState(1)
    const [R1, setR1] = useState(1)
    const [E, setE] = useState(1)
    const [inputR, setInputR] = useState(0)
    const [inputR1, setInputR1] = useState(0)
    const [inputE, setInputE] = useState(0)

    useEffect(()=>{
        async function getPriceList (){
            let value = await getSettings()
            setSettings(_.orderBy(value, ['type', 'price']))

            const Rdb = value.find(el => el.title === 'R')?.price;
            if (!Rdb) {
                await $host.post('/api/settings/changePriceDel', {title: 'R', price: 3})
            }else setR(Rdb)

            const Edb = value.find(el => el.title === 'E')?.price;
            if (!Rdb) {
                await $host.post('/api/settings/changePriceDel', {title: 'E', price: 4})
            }else setE(Edb)

            const R1db = value.find(el => el.title === 'R1')?.price;
            if (!Rdb) {
                await $host.post('/api/settings/changePriceDel', {title: 'R1', price: 2})
            }else setR1(R1db)
        }
        getPriceList()

        

    }, [])

    const AddSetting = async()=>{
        await addSettings(type, title, name, price)
            let updatedSettings = [...settings, {'type': type, 'title': title, 'name': name, 'price': price}]; 
            let sortedSettings = _.orderBy(updatedSettings, ['type', 'price']);
            setSettings(sortedSettings);
        setTitle('')
        setName('')
        setPrice('')
    }

    const  DeleteSetting=async(id) =>{
        const userConfirmation = window.confirm("Вы уверены, что хотите удалить?");

        if(userConfirmation){
            await deleteSetting(id)
            setSettings([...settings.filter(el=>el.id!==id)])
        }
    }

    const changePrice = async(title, price) =>{
        const data1 = {title, price}
        const {data} = await $host.post('/api/settings/changePriceDel', data1)
        if(data==='ok'){

            setInputR(0)
            setInputR1(0)
            setInputE(0)
        }
    }


    return(
        <div className="containerMain">
            {settings.map((el, index)=> (el.type !== 'deliver')&&
                <div  className="container" key={index}>
                    <button style={{border: 'none', background: 'rgb(234, 234, 234)'}}>{el.type}</button>
                    <button style={{border: 'none', background: 'rgb(234, 234, 234)'}}>{el.title}</button>
                    <button style={{border: 'none', background: 'rgb(234, 234, 234)'}}>{el.name}</button>
                    <button style={{border: 'none', background: 'rgb(234, 234, 234)'}}>{el.price}</button>
                    <button onClick={()=>DeleteSetting(el.id)} style={{border: '1px solid black'}}>удалить</button>
                </div>
            )}

            <div className="container">
                <select  
                    value={type} 
                    onChange={(e)=>setType(e.target.value)}
                >
                    <option value='photo'>фото</option>
                    <option value='holst'>холст</option>
                    <option value='magnit'>магнит</option>
                </select>
                <input 
                    value={title} 
                    onChange={(e)=>setTitle(e.target.value)} 
                />
                <input 
                    value={name} 
                    onChange={(e)=>setName(e.target.value)} 
                />
                <input 
                    value={price} 
                    onChange={(e)=>setPrice(e.target.value)} 
                />
                <button 
                    onClick={()=>AddSetting()}
                    style={{border: '1px solid black'}}
                >
                    Добавить
                </button>
            </div>

            <div style={{background: 'rgb(234, 234, 234)', width: '50%', marginTop: 50, padding: 5}}>
                <div className='flex items-center justify-around text-center'>
                    <button className="flex-[2]">Белпочта:</button>      
                    <div className='flex-1' style={{textAlign: 'left'}}>{R}р</div>
                    <div className='flex-1'> <input style={{width:'100%'}} value={inputR} onChange={(e)=>setInputR(e.target.value)} /></div>
                    <button className="flex-[2] m-1" style={{border:' 1px solid black'}} onClick={()=>changePrice('R', inputR)}>изменить</button>  
                </div>
                <div className='flex items-center justify-around text-center'>
                    <button className="flex-[2]">Европочта:</button>      
                    <div className='flex-1' style={{textAlign: 'left'}}>{E}р</div>
                    <div className='flex-1'> <input style={{width:'100%'}}  value={inputE} onChange={(e)=>setInputE(e.target.value)} /></div>
                    <button className="flex-[2] m-1" style={{border:' 1px solid black'}} onClick={()=>changePrice('E', inputE)}>изменить</button>  
                </div>
                <div className='flex items-center justify-around text-center'>
                    <button className="flex-[2]">Первый класс:</button>      
                    <div className='flex-1' style={{textAlign: 'left'}}>{R1}р</div>
                    <div className='flex-1'> <input style={{width:'100%'}}  value={inputR1} onChange={(e)=>setInputR1(e.target.value)} /></div>
                    <button className="flex-[2] m-1" style={{border:' 1px solid black'}} onClick={()=>changePrice('R1', inputR1)}>изменить</button>  
                </div>
            </div>
                
                  
                

        </div>
    )
}