import { useState, useEffect } from "react"
import { NavBar } from "../components/admin/NavBar"
import {FormControl, Card, Button, Toast} from 'react-bootstrap'
import { passwordChange, dataChange } from "../http/authApi"
import { whoAmI } from '../http/authApi';

const PrivatePage = () =>{

    const [nikname, setNikname] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')

    useEffect(()=>{
        async function getUser (){
            let value = await whoAmI()
            
            setNikname(value.nikname)
            setName(value.name)
            setPhone(value.phone)
        }
        getUser()
  
    },[])

    const [oldPW, setOldPW] = useState('')
    const [newPW1, setNewPW1] = useState('')
    const [newPW2, setNewPW2] = useState('')

  

    const [show, setShow] = useState(false);
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);
    
    const Change =async()=>{
        if(newPW1===newPW2){ 
            const res = await passwordChange(oldPW, newPW1)
            if(res===0) setShow1(true)
            else setShow2(true)
        }else setShow(true)
    }

    const ChangeData =async()=>{
        await dataChange(phone, name, nikname)
        setShow2(true)
    }

    return (
        <div>
            <NavBar />
            
            <h3 style={{display:'flex', justifyContent:'center', margin: 30}}>Личный кабинет</h3>
            <div  style={{display:'flex', justifyContent:'center'}}>
            <Card style={{width: '20%', margin:'30px'}}>
                <Card.Header>
                Изменить пароль
                </Card.Header>
                <Card.Body>
                    <FormControl className="mt-1" placeholder="старый пароль" onChange={(e)=>setOldPW(e.target.value)} />
                    <FormControl className="mt-1" placeholder="новый пароль" onChange={(e)=>setNewPW1(e.target.value)} />
                    <FormControl className="mt-1" placeholder="повторите новый пароль"  onChange={(e)=>setNewPW2(e.target.value)}/>
                    <Button style={{float: 'right'}} variant='secondary' className="mt-2" onClick={()=>Change()}>отправить</Button>
                </Card.Body>

            </Card>

            <Card style={{width: '20%', margin:'30px'}}>
                <Card.Header>
                Изменить данные
                </Card.Header>
                <Card.Body>
                <FormControl className="mt-1" placeholder="Телефон" value={phone} onChange={(e)=>setPhone(e.target.value)} />
                    <FormControl className="mt-1" placeholder="Никнейм" value={nikname} onChange={(e)=>setNikname(e.target.value)} />
                    <FormControl className="mt-1" placeholder="ФИО" value={name} onChange={(e)=>setName(e.target.value)} />
                    <Button style={{float: 'right'}} variant='secondary' className="mt-2" onClick={()=>ChangeData()}>отправить</Button>
                </Card.Body>

            </Card>
            </div>

            <Toast bg="danger" onClose={() => setShow(false)} show={show} delay={2000} autohide>
                <Toast.Body>Пароли не совпадают</Toast.Body>
            </Toast>
            <Toast bg="danger" onClose={() => setShow1(false)} show={show1} delay={2000} autohide>
                <Toast.Body>Не верный старый пароль</Toast.Body>
            </Toast>
            <Toast bg="success" onClose={() => setShow2(false)} show={show2} delay={2000} autohide>
                <Toast.Body>Изменено</Toast.Body>
            </Toast>
            
        </div>
    )
}

export default PrivatePage

