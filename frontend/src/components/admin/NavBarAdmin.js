import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import {logout } from '../../http/authApi'
import './NavbarAdmin.css';
import { LeftMenu } from './LeftMenu';


export const NavBarAdmin = () =>{

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const user = useSelector(state=>state.private.user)
 
    const isAuth = useSelector(state=>state.auth.auth)

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
        <nav className="navbarA">
          <LeftMenu />
        <div className="navbar__leftA">
          <span className="navbar__titleA"  onClick={isAuth&&user.role==='ADMIN' ?()=>dispatch({type:'showLeftMenu'}):null}>LINK</span>
        </div>
  
        <div className="navbar__rightA">
          <div
            className="nav-button-containerA"
            onMouseEnter={handleMenuOpen}
            onMouseLeave={handleMenuClose}
          >
            <button className="navbar__profileA" onClick={()=>navigate('/PrivatePage')}><i className="bi bi-person-fill"></i>мой профиль <i className="bi bi-chevron-down"></i></button>
            {menuOpen && (
              <div className="navbar__menuA">
                <div className="navbar__menu-itemA" style={{fontSize: 11, marginBottom: 10}}  onClick={()=>navigate('/PrivatePage')}>  {user.FIO}</div>
                <div className="navbar__menu-itemA" onClick={()=>Logout()} ><i className="bi bi-box-arrow-right"></i> выйти</div>
              </div>
            )}
          </div>
        </div>
      </nav>

       
    )
}


