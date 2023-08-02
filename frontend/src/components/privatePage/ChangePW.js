import {useState} from 'react'
import { passwordChange } from "../../http/authApi"
import './Settings.css'


export const ChangePW = ({ShowToast}) =>{

    const [oldPW, setOldPW] = useState('')
    const [newPW1, setNewPW1] = useState('')
    const [newPW2, setNewPW2] = useState('')

    const Change =async()=>{
        if(newPW1===newPW2){ 
            const res = await passwordChange(oldPW, newPW1)
            if(res===0) ShowToast('danger', 'Не верный старый пароль')
            else ShowToast('success', 'Пароль изменен')
        }else ShowToast('danger', 'Пароли не совпадают')
    }


    

    return(
        <div className="card_form">
            <div className="form_group">
                <label className="form_label"> <i className="bi bi-unlock"></i> Старый пароль:</label>
                <input
                className="form_control"
                type="password"
                onChange={(e) => setOldPW(e.target.value)}
                />
            </div>
            <div className="form_group">
                <label className="form_label"><i className="bi bi-lock"></i> Новый пароль:</label>
                <input
                className="form_control"
                type="password"
                onChange={(e) => setNewPW1(e.target.value)}
                />
            </div>
            <div className="form_group">
                <label className="form_label"><i className="bi bi-lock"></i> Повторите новый пароль:</label>
                <input
                className="form_control"
                type="password"
                onChange={(e) => setNewPW2(e.target.value)}
                />
            </div>

            <button className="btn btn_save" onClick={() => Change()}>
                <i className="bi bi-check2-square"></i> сохранить изменения
            </button>
        </div>
    )
}