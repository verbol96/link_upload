import {Routes, Route, Navigate} from 'react-router-dom'
import { routes, privateRoutes } from '../routes'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {refresh} from '../http/authApi'

const AppRouter = () =>{
    const dispach = useDispatch()

    useEffect(()=>{
        if(localStorage.getItem('token')){
            const data = refresh()
              if (typeof data === 'object') dispach({type: 'authStatus', paylods: true})
          }
    },[dispach])

    const isAuth = useSelector(state=>state.auth.auth)

    return(
        <Routes>
        {isAuth ? 
            privateRoutes.map(({path, Component})=>{
                return <Route key={path} path={path} element={<Component />} exact/>}
           )
           :
           routes.map(({path, Component})=>{
            
                return <Route key={path} path={path} element={<Component />} exact/>}
            )
        }

        <Route path='*' element={<Navigate to='/web'/>} />
    </Routes>
    )
}

export default AppRouter