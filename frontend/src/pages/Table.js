import { TableFull } from "../componentsTable/TableFull"
import {useEffect, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {refresh, login} from '../http/authApi'
import {Button, FormControl, Card} from 'react-bootstrap'

const Table = () =>{

    const dispach = useDispatch()
    const isAuth = useSelector(state=>state.auth.auth)

    const [phone,setPhone] = useState('')
    const [password,setPassword] = useState('')

    useEffect(()=>{
        if(localStorage.getItem('token')){
            const data = refresh()
              if (typeof data === 'object') dispach({type: 'authStatus', paylods: true})
          }
    },[dispach])
    
    const Send = async() =>{
        const data = await login(phone, password)
        if (typeof data === 'object') dispach({type: 'authStatus', paylods: true})
    }

    return(
        <div>
            {isAuth ? 
                <TableFull />
            :

            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '15%'}}>
                <Card style={{width: '30%'}}>
                    <Card.Body>
                    
                        <FormControl className="mt-2" placeholder='phone' value={phone} onChange={(e)=>setPhone(e.target.value)} />
                        <FormControl className="mt-2" placeholder='password'  value={password} onChange={(e)=>setPassword(e.target.value)}/>
                        <Button className="mt-2" variant='secondary' onClick={()=>Send()}>войти</Button>
                    
                    </Card.Body>
                    
                </Card>
                </div>
            }
            
        </div>
    )
}

export default Table