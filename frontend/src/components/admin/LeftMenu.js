import React from 'react';
import {Offcanvas, Row, Button} from 'react-bootstrap'
import {useNavigate} from 'react-router-dom'
import {useSelector, useDispatch} from 'react-redux'
import { useEffect, useState } from 'react';
import { whoAmI } from '../../http/authApi';

export const LeftMenu = ()=>{
  
  const navigate = useNavigate()
  const dispach = useDispatch()
  const leftMenu = useSelector(state=>state.order.leftMenu)

  const [user, setUser] = useState('')


    useEffect(()=>{
      async function getUser (){
          let value = await whoAmI()
          setUser(value)
      }
      getUser()

  },[])


  const Close = (link) =>{
    dispach({type:'closeLeftMenu'})
    navigate(link)
  }

  return (
    <>
      <Offcanvas show={leftMenu} onHide={()=>dispach({type:"closeLeftMenu"})} style={{width: 300, backgroundColor:'rgb(232, 232, 232)'}}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>АДМИН ПАНЕЛЬ</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
        <Row className='mt-3'>
            <Button variant="dark" onClick={()=>Close('/table')}>
                Таблица
            </Button>
            </Row>
            <Row className='mt-3'>
            <Button variant="dark" onClick={()=>Close('/usersDB')}>
                Клиенты
            </Button>
            </Row>
            <Row className='mt-3'>
            <Button variant="dark" onClick={()=>Close('/PrivatePage')}>
                Личный кабинет
            </Button>
            </Row>
            <Row className='mt-3'>
            <Button variant="dark" onClick={()=>Close('/statistic')}>
                Статистика
            </Button>
            </Row>
            <Row className='mt-3'>
            <Button variant="dark" onClick={()=>Close('/web')}>
                Сайт
            </Button>
            </Row>
            <Row className='mt-3'>
            <Button variant="dark" onClick={()=>Close('/setting')}>
                Настройки
            </Button>
            </Row>
            <Row className='mt-3'>
            <Button variant="dark" onClick={()=>Close('/cloud')}>
                Link Cloud 
            </Button>
            </Row>
            <h6 style={{marginTop: '300px'}}>{user.name}</h6>
            <h6>{user.phone}</h6>
           
        
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
