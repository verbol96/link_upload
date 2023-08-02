import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import {logout } from '../../http/authApi'
import './Navbar.css';
import { LeftMenu } from '../admin/LeftMenu';


export const NavBar = () =>{

    const navigate = useNavigate()
    const dispach = useDispatch()
    const user = useSelector(state=>state.private.user)
 
    const isAuth = useSelector(state=>state.auth.auth)

      const Logout = async() =>{
        dispach({type: 'authStatus', paylods: false})
        await logout()
     }

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
          <span className="navbar__title"  onClick={isAuth&&user.role==='ADMIN' ?()=>dispach({type:'showLeftMenu'}):null}>LINK</span>
        </div>
  
        <div className="navbar__right">
         
  
          <div
            className="nav-button-container"
            onMouseEnter={handleMenuOpen}
            onMouseLeave={handleMenuClose}
          >
            <button className="navbar__profile" onClick={()=>navigate('/PrivatePage')}><i className="bi bi-person-fill"></i>мой профиль <i className="bi bi-chevron-down"></i></button>
            {menuOpen && (
              <div className="navbar__menu">
                <div className="navbar__menu-item" style={{fontSize: 11, marginBottom: 10}}  onClick={()=>navigate('/PrivatePage')}>  {user.FIO}</div>
                <div className="navbar__menu-item" onClick={()=>Logout()} ><i className="bi bi-box-arrow-right"></i> выйти</div>
              </div>
            )}
          </div>
        </div>
      </nav>

       
    )
}


