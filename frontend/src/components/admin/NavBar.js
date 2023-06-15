import {Row, Col, Button, FormControl} from 'react-bootstrap'
import { LeftMenu } from './LeftMenu'
import {useDispatch, useSelector} from 'react-redux'
import {useState, useEffect} from 'react'
import { login, logout, refresh } from '../../http/authApi'
import './style.css'

export const NavBar = () =>{
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

    const Logout = async() =>{
        dispach({type: 'authStatus', paylods: false})
        await logout()
    }

    return (
        <div style={{ 
            backgroundColor: 'DarkSlateGrey', minHeight: 50, width: '97%',
            margin: 15, borderRadius: 10
            }}>
            <LeftMenu />
            
                
                {isAuth?<Row>
                    <Col md={{span: 1, offset: 1}}>
                        <Button variant='dark' className='mt-2' style={{marginLeft: '5%', color: 'black', backgroundColor: 'DarkSlateGrey'}} size='sm' onClick={()=>dispach({type:'showLeftMenu'})}>
                            <i className="bi bi-list"></i>
                        </Button>
                    </Col>
                    <Col  md={{span: 1, offset: 8}}  >
                        <Button size='sm' variant='dark' className='mt-2' onClick={()=>Logout()}>выйти</Button>
                    </Col>
                   </Row>
                :
                    <Row>
                    <Col md={{span:2, offset:7}}className='mt-2'>
                    <FormControl size='sm' placeholder='phone' value={phone} onChange={(e)=>setPhone(e.target.value)} />
                    </Col>
                    <Col md={2}className='mt-2'>
                        <FormControl  size='sm' placeholder='password'  value={password} onChange={(e)=>setPassword(e.target.value)}/>
                    </Col>
                    <Col md={1}className='mt-2'>
                        <Button  size='sm' variant='secondary' onClick={()=>Send()}>войти</Button>
                    </Col>
                    </Row>
                }
        </div>
    )
}