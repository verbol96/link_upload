import { useState } from 'react';
import './style.css'
import logo from '../../image/logo.jpg'
import {Popover, Button, OverlayTrigger, Stack} from 'react-bootstrap'

export const NavBarForm = () =>{

    const popover = (
        <Popover id="popover-basic">
          
          <Popover.Body>
            <Stack>
            <input type="text" placeholder="Логин" />
            <input type="password" placeholder="Пароль" />
            <button>Войти</button>
            </Stack>
          </Popover.Body>
        </Popover>
      );

    return(
        <div className="navBarForm">
        <div className="navBarContent">
            <img className="navBarLogo" src={logo} alt="Логотип" />
            <h4 className="navBarTitle">Форма для заказа</h4>
            <div className="navBarButtons">
                <OverlayTrigger trigger="click" placement="bottom" overlay={popover}>
                    <button className="navBarButton">Личный кабинет</button>
                </OverlayTrigger>
                
            </div>
        </div>
        </div>
    )
}