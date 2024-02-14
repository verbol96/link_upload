import {  adminRoutes, publicRoutes, userRoutes } from '../routes'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {whoAmI} from '../http/authApi'
import { setUser } from '../store/privatePageReducer'
import { getOneUser } from '../http/dbApi'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

const AppRouter = () => {
  const dispatch = useDispatch();
  const location = useLocation()
  const [userRole, setUserRole]=useState('')
  const [isUserDataLoaded, setUserDataLoaded] = useState(false)  

  useEffect(()=>{
    if(localStorage.getItem('token')){
        
          dispatch({type: 'authStatus', paylods: true})

          async function getUser (){
            const user = await whoAmI()
            setUserRole(user.role)
            let data = await getOneUser(user.phone)
            dispatch(setUser(data))
            setUserDataLoaded(true)  // устанавливаем в true, когда данные загружены
          }
          getUser()
    } else {
      setUserDataLoaded(true)  // устанавливаем в true, если токена нет
    }
},[dispatch, location.pathname])

const isAuth = useSelector(state=>state.auth.auth)
  
  return (
    isUserDataLoaded && (  // рендерим только когда данные пользователя загружены
    <Routes>
      {isAuth
        ? (
          userRole === 'ADMIN'
            ? adminRoutes.map(({ path, Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))
            : userRoutes.map(({ path, Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))
        )
        : publicRoutes.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))
      }
      
      <Route path="*" element={<Navigate to={isAuth && userRole==='ADMIN'? "/table" : isAuth ? "/private": '/web'} />} />
    </Routes>
    )
  );
};

export default AppRouter;
