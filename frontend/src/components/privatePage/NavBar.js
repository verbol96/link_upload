import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import {logout } from '../../http/authApi'
import './Navbar.css';
import { LeftMenu } from '../admin/LeftMenu';


export const NavBar = ({ onMenuItemClick, selectedMenuItem }) =>{

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const user = useSelector(state=>state.private.user)

    const Logout = async () => {
      if (window.confirm("Вы уверены, что хотите выйти?")) {
        dispatch({type: 'authStatus', paylods: false})
          await logout();
          navigate('/web')
      }
  };

     const [menuOpen, setMenuOpen] = useState(false);

     const handleMenuOpen = () => {
        setMenuOpen(true);
      };
    
      const handleMenuClose = () => {
        setMenuOpen(false);
      };

 

    return(
        <nav className="navbar">
          <LeftMenu />
        <div className="navbar__left">
          <span className="navbar__title"  onClick={()=>user.role==='ADMIN' ? dispatch({type:'showLeftMenu'}): {}}>LINK</span>
        </div>
  
        <div className="navbar__right">
          <div className="nav-button-container">
            <button className="navbar__profile" onClick={() => navigate('/Web')}><i className="bi bi-cart-fill"></i> сделать заказ</button>
          </div>
  
          <div
            className="nav-button-container"
            onMouseEnter={handleMenuOpen}
            onMouseLeave={handleMenuClose}
          >
            <button className="navbar__profile"><i className="bi bi-person-fill"></i>мой профиль <i className="bi bi-chevron-down"></i></button>
            {menuOpen && (
              <div className="navbar__menu">
                <div className="navbar__menu-item" style={{fontSize: 11, marginBottom: 10}}>  {user.FIO}</div>
                <div className={`navbar__menu-item${selectedMenuItem === 'мои заказы' ? ' navbar__menu-item--active' : ''}`} onClick={() => onMenuItemClick('мои заказы')}> <i className="bi bi-bag-check"></i> мои заказы</div>
                <div className={`navbar__menu-item${selectedMenuItem === 'настройки' ? ' navbar__menu-item--active' : ''}`} onClick={() => onMenuItemClick('настройки')}><i className="bi bi-gear"></i> настройки</div>
                <div className={`navbar__menu-item${selectedMenuItem === 'файлы' ? ' navbar__menu-item--active' : ''}`} onClick={() => onMenuItemClick('файлы')}><i className="bi bi-cloud-arrow-down"></i> файлы</div>
                <div className="navbar__menu-item" onClick={()=>Logout()} ><i className="bi bi-box-arrow-right"></i> выйти</div>
              </div>
            )}
          </div>
        </div>
      </nav>

       
    )
}


