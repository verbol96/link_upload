import { routes, privateRoutes } from '../routes'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {refresh, whoAmI} from '../http/authApi'
import { setUser } from '../store/privatePageReducer'
import { getOneUser } from '../http/dbApi'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

const AppRouter = () => {
  const dispatch = useDispatch();
  const location = useLocation()
  const [user, setUser]=useState('')

  useEffect(()=>{
    if(localStorage.getItem('token')){
        const data = refresh()
          if (typeof data === 'object') dispatch({type: 'authStatus', paylods: true})

          async function getUser (){
            const user = await whoAmI()
            setUser(user.role)
            let data = await getOneUser(user.phone)
            dispatch(setUser(data))
          }
          getUser()
    }
    
      
     
},[dispatch, location.pathname])


const isAuth = useSelector(state=>state.auth.auth)
  
  return (
    <Routes>
      {isAuth
        ? privateRoutes.map(({ path, Component }) => {
            return <Route key={path} path={path} element={<Component />} />;
          })
        : routes.map(({ path, Component }) => {
            return <Route key={path} path={path} element={<Component />} />;
          })}
        {user==='ADMIN'?<Route path="*" element={<Navigate to="/table" />} />: <Route path="*" element={<Navigate to="/web" />} />}
      
    </Routes>
  );
};

export default AppRouter;