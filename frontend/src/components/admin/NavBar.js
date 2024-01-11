import { useNavigate, useLocation } from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux'
import {logout } from '../../http/authApi'
import { LeftMenu } from './LeftMenu';
import style from './NavBar.module.css'
import { setUser } from '../../store/privatePageReducer';

export const NavBar = () =>{

    const navigate = useNavigate()
    const location = useLocation(); 
    const dispatch = useDispatch()

    const user = useSelector(state=>state.private.user)
    const isAuth = useSelector(state=>state.auth.auth)

    const Logout = async () => {
      if (window.confirm("Вы уверены, что хотите выйти?")) {
        dispatch({type: 'authStatus', paylods: false})
        dispatch(setUser({user: {}, order: {}}))
        await logout();
        navigate('/web')
        localStorage.removeItem('token');
      }
  };

 

    return(
        <div className={style.navBar}>
          <LeftMenu />

          <div>
            <div className={style.logo}  onClick={isAuth&&user.role==='ADMIN' ?()=>dispatch({type:'showLeftMenu'}):null}>LINK</div>
          </div>
    
          <div className={style.menu}>

            {isAuth?
            <>
              {
                location.pathname === '/PrivatePage'
                ? 
                  <label className={style.labelMenu} style={{color: 'white'}} onClick={() => navigate('/Web')}>
                  Форма заказа
                  </label>
              :
                  <label className={style.labelMenu} style={{color: 'white'}} onClick={() => navigate('/PrivatePage')}>
                  Личный кабинет
                  </label>
              }
              
              <label className={style.labelMenu} style={{color: 'white'}} onClick={Logout}>
                Выйти
              </label>
            </>
              
            :
              <>
              {
                location.pathname === '/Auth'
                ?
                <label className={style.labelMenu} style={{color: 'white'}} onClick={() => navigate('/Web')}>
                Форма заказа
                </label>
                :
                <label className={style.labelMenu} style={{color: 'white'}} onClick={() => navigate('/Auth')}>
                Войти
                </label>
              }
              </>
            }
          </div>
        </div>
    )
}


