import { addSettings, deleteSetting, getSettings } from "../../http/dbApi"
import { useState, useEffect } from "react"
import '../settings/Pricing.css'
import _ from 'lodash'

export const Pricing = () =>{

    const [settings, setSettings] = useState([])

    const [type, setType] = useState('фото')
    const [title, setTitle] = useState('')
    const [price, setPrice] = useState('')

    useEffect(()=>{
        async function getPriceList (){
            let value = await getSettings()
            setSettings(_.orderBy(value, ['type', 'price']))
        }
        getPriceList()

    }, [])

    const AddSetting = async()=>{
        await addSettings(type, title, price)
            let updatedSettings = [...settings, {'type': type, 'title': title, 'price': price}]; 
            let sortedSettings = _.orderBy(updatedSettings, ['type', 'price']);
            setSettings(sortedSettings);
        setTitle('')
        setPrice('')
    }

    const  DeleteSetting=async(id) =>{
        const userConfirmation = window.confirm("Вы уверены, что хотите удалить?");

        if(userConfirmation){
            await deleteSetting(id)
            setSettings([...settings.filter(el=>el.id!==id)])
        }
    }


    return(
        <>
            {settings.map((el, index)=>
                <div  className="container" key={index}>
                    <button style={{border: 'none', background: 'rgb(234, 234, 234)'}}>{el.type}</button>
                    <button style={{border: 'none', background: 'rgb(234, 234, 234)'}}>{el.title}</button>
                    <button style={{border: 'none', background: 'rgb(234, 234, 234)'}}>{el.price}</button>
                    <button onClick={()=>DeleteSetting(el.id)} style={{border: '1px solid black'}}>удалить</button>
                </div>
            )}

            <div className="container">
                <select 
                    value={type} 
                    onChange={(e)=>setType(e.target.value)}
                >
                    <option value='фото'>фото</option>
                    <option value='холст'>холст</option>
                    <option value='магнит'>магнит</option>
                </select>
                <input 
                    value={title} 
                    onChange={(e)=>setTitle(e.target.value)} 
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
        </>
    )
}