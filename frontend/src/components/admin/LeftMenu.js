import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import './LeftMenu.css'

export const LeftMenu = () => {
  const navigate = useNavigate();
  const location = useLocation(); // добавьте эту строку
  const dispatch = useDispatch();
  const leftMenu = useSelector((state) => state.order.leftMenu);

  const user = useSelector((state) => state.private.user);

  const Close = (link) => {
    dispatch({ type: 'closeLeftMenu' });
    navigate(link);
  };

  // Добавьте функцию для определения активного пункта меню
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {leftMenu && (
        <div
          className="overlay"
          onMouseDown={() => dispatch({ type: 'closeLeftMenu' })}
        ></div>
      )}
      <div className={`offcanvas ${leftMenu ? 'show' : ''}`}>
        <div className="offcanvas-content">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">АДМИН ПАНЕЛЬ</h5>
            <button className="close-btn" onClick={() => dispatch({ type: 'closeLeftMenu' })}>
              &times;
            </button>
          </div>
          <div className="offcanvas-body">
            <button
              className={`menu-btn ${isActive('/table') ? 'active' : ''}`}
              onClick={() => Close('/table')}
            >
              Таблица
            </button>
            
            <button
              className={`menu-btn ${isActive('/editor2') ? 'active' : ''}`}
              onClick={() => Close('/editor2')}
            >
              Редактор фото
            </button>
            <button
              className={`menu-btn ${isActive('/PrivatePage') ? 'active' : ''}`}
              onClick={() => Close('/PrivatePage')}
            >
              Личный кабинет
            </button>
            <button
              className={`menu-btn ${isActive('/statistic') ? 'active' : ''}`}
              onClick={() => Close('/statistic')}
            >
              Статистика
            </button>
            <button
              className={`menu-btn ${isActive('/web') ? 'active' : ''}`}
              onClick={() => Close('/web')}
            >
              Сайт
            </button>
            <button
              className={`menu-btn ${isActive('/users') ? 'active' : ''}`}
              onClick={() => Close('/users')}
            >
              Клиенты
            </button>
            <button
              className={`menu-btn ${isActive('/setting') ? 'active' : ''}`}
              onClick={() => Close('/setting')}
            >
              Настройки
            </button>
            <button
              className={`menu-btn ${isActive('/cloud') ? 'active' : ''}`}
              onClick={() => Close('/cloud')}
            >
              Link Cloud
            </button>
          </div>
          <div className="user-info">
            <div><i className="bi bi-person"></i> {user.FIO}</div>
            <div><i className="bi bi-telephone"></i>  {user.phone}</div>
          </div>
        </div>
      </div>
    </>
  );
};