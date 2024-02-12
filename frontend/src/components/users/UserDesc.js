import {useState} from 'react'
import { users_changeData, users_delete } from '../../http/authApi'
import style from './UserDesc.module.css'


export const UserDesc = ({user}) =>{

    const [phone, setPhone] = useState(user.phone || '')
    const [FIO, setFIO] = useState(user.FIO || '')
    const [typePost, setTypePost] = useState(user.typePost || '')
    const [city, setCity] = useState(user.city || '')
    const [adress, setAdress] = useState(user.adress || '')
    const [postCode, setPostCode] = useState(user.postCode || '')
    const [role, setRole] = useState(user.role || '')
    const [oblast, setOblast] = useState(user.oblast || '')
    const [raion, setRaion] = useState(user.raion || '')

    const saveUser = async () => {
        if(window.confirm("Вы уверены, что хотите сохранить изменения?")) {
            try {
                await users_changeData(user.id, phone, FIO, typePost, city, adress, postCode, raion, oblast, role)
                alert("Изменения сохранены");
            } catch (error) {
                if(error.message === "Request failed with status code 500") alert("Ошибка! Такой номер уже существует");
                else alert("Произошла ошибка при сохранении изменений");
            }
        }
    }
    
    const deleteUser = async () => {
        if(user.role==='ADMIN'){
            alert('Нельзя удалить админа')
            return;
        } 
        if(user.orderCount>0){
            alert('Нельзя удалить. Имеются заказы')
            return;
        } 
        if(window.confirm("Вы уверены, что хотите удалить пользователя?")) {
            try {
                await users_delete(user.id)
                alert("Пользователь удален");
            } catch (error) {
                alert("Произошла ошибка при удалении пользователя");
            }
        }
    }

    return(
        <>
        <div className={style.row}>
            <input className={style.input} style={{flex: 2.5, fontFamily: "'Roboto Mono', monospace"}}  value={phone} onChange={(e)=>setPhone(e.target.value)} />
            <input className={style.input} style={{flex: 5}} value={FIO} onChange={(e)=>setFIO(e.target.value)} />
            <input className={style.input} style={{flex: 1}} value={typePost} onChange={(e)=>setTypePost(e.target.value)} />
            <input className={style.input} style={{flex: 2}} value={city} onChange={(e)=>setCity(e.target.value)} />
            <input className={style.input} style={{flex: 4}} value={adress} onChange={(e)=>setAdress(e.target.value)} />
            <input className={style.input} style={{flex: 1}} value={postCode} onChange={(e)=>setPostCode(e.target.value)}/>
            <input className={style.input} style={{flex: 2}} value={raion} onChange={(e)=>setRaion(e.target.value)} />
            <input className={style.input} style={{flex: 2}} value={oblast} onChange={(e)=>setOblast(e.target.value)} />
            
            <select className={style.input} style={{flex: 2}} value={role} onChange={(e)=>setRole(e.target.value)} >
                <option value={'USER'}>USER</option>
                <option value={'PARTNER'}>PARTNER</option>
                <option value={'ADMIN'}>ADMIN</option>
            </select>
            
            <button style={{flex: 1, minWidth: 50, padding: '0 5px', background: '#3AAFA9', border: '1px solid green', borderRadius: 5, marginLeft: 10, color: 'white'}} onClick={saveUser}>save</button>
            <button style={{flex: 1, minWidth: 50, padding: '0 5px', borderRadius: 5, border: '1px solid green', background: 'white'}} onClick={deleteUser}>delete</button>
            <span className={style.span}>{user.orderCount} шт</span>
            <span className={style.span}>{user.totalOrderSum.toFixed(2)} р </span>
        </div>
        
        </>
    )
} 