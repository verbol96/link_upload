import './styleUsers.css'
import {useState} from 'react'
import { users_changeData, users_changePW, users_delete } from '../../http/authApi'

export const OneUser = ({user}) =>{

const [pw, setPw] = useState('')
const [phone, setPhone] = useState(user.phone || '')
const [FIO, setFIO] = useState(user.FIO || '')
const [city, setCity] = useState(user.city || '')
const [role, setRole] = useState(user.role || '')


const saveUser = async () => {
    if(window.confirm("Вы уверены, что хотите сохранить изменения?")) {
        try {
            await users_changeData(user.id, phone, FIO, city, role)
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

const changePassword = async () => {
    if(window.confirm("Вы уверены, что хотите изменить пароль?")) {
        try {
            await users_changePW(user.id, pw)
            alert("Пароль успешно изменен");
        } catch (error) {
            alert("Произошла ошибка при изменении пароля");
        }
    }
}

    return(
        <div className="oneUser">
            <input style={{flex: 1, fontFamily: "'Roboto Mono', monospace"}} value={phone} onChange={(e)=>setPhone(e.target.value)} />
            <input style={{flex: 2, width: 200}} value={FIO} onChange={(e)=>setFIO(e.target.value)} />
            <input style={{flex: 1}} value={city} onChange={(e)=>setCity(e.target.value)} />
            <select style={{flex: 1}} value={role} onChange={(e)=>setRole(e.target.value)} >
                <option value={'USER'}>USER</option>
                <option value={'PARTNER'}>PARTNER</option>
                <option value={'ADMIN'}>ADMIN</option>
            </select>
            <button onClick={saveUser}>сохранить</button>
            <button onClick={deleteUser}>удалить</button>
            <span style={{flex: 2, textAlign: 'center', marginLeft: 5, fontSize:10, color: 'darkgreen'}}>заказов: {user.orderCount}, сумма: {user.totalOrderSum.toFixed(2)} </span>
            <span style={{flex: 1, textAlign: 'right'}}>пароль: </span>
            <input style={{width: 100}} value={pw} onChange={(e)=>setPw(e.target.value)} />
            <button onClick={changePassword}>изменить</button>
        </div>
    )
}