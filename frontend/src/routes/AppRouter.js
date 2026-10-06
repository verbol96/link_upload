import { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { setLogUser, setLogUserData, whoAmI } from '../http/authApi';
import { setUser } from '../store/privatePageReducer';
import { getOneUser } from '../http/dbApi';
import { COMPONENT_MAP } from './routes';
import { getRoutesForRole, getPublicRoutes } from './access';

const AppRouter=()=>{
    const dispatch=useDispatch();
    const location=useLocation();
    const isAuth=useSelector((state)=>state.auth.auth);
    const[userRole,setUserRole]=useState('');
    const[isUserDataLoaded,setUserDataLoaded]=useState(false);
    const initialPage=useRef(location.pathname);
    const visitLogged=useRef(false);

    useEffect(()=>{
        const loadUser=async()=>{
            if(localStorage.getItem('token')){
                try{
                    const user=await whoAmI();
                    setUserRole(user.role);
                    dispatch({type:'authStatus',paylods:true});

                    const data=await getOneUser(user.phone);
                    dispatch(setUser(data));
                    setLogUserData(data.user);
                }catch(err){
                    console.error('Ошибка загрузки пользователя:',err);
                    setUserRole('');
                    setLogUserData(null);
                }finally{
                    setUserDataLoaded(true);
                }
            }else{
                setUserRole('');
                setLogUserData(null);
                setUserDataLoaded(true);
            }
        };

        loadUser();
    },[dispatch,isAuth]);

    useEffect(()=>{
        if(!isUserDataLoaded||visitLogged.current)return;

        visitLogged.current=true;

        setLogUser({
            event:'visit',
            eventType:'info',
            page:initialPage.current
        }).catch(error=>{
            console.error('setLogUser error:',error);
        });
    },[isUserDataLoaded]);

    useEffect(()=>{
        if(!isUserDataLoaded||!visitLogged.current)return;

        if(location.pathname===initialPage.current){
            initialPage.current=null;
            return;
        }

        setLogUser({
            event:'page_view',
            eventType:'info',
            page:location.pathname
        }).catch(error=>{
            console.error('page_view log error:',error);
        });
    },[location.pathname,isUserDataLoaded]);

    const allowedPaths=useMemo(()=>{
        if(!isAuth)return getPublicRoutes();
        if(!userRole)return getPublicRoutes();

        return getRoutesForRole(userRole);
    },[isAuth,userRole]);

    const fallbackPath=useMemo(()=>{
        if(!isAuth)return'/web';
        if(userRole==='ADMIN'||userRole==='WORKER')return'/table';

        return'/myOrders';
    },[isAuth,userRole]);

    if(!isUserDataLoaded)return null;

    return (
        <Routes>
            {allowedPaths.map((path)=>{
                const Component=COMPONENT_MAP[path];

                if(!Component)return null;

                return <Route key={path} path={path} element={<Component />}/>;
            })}
            <Route path="*" element={<Navigate to={fallbackPath} replace />}/>
        </Routes>
    );
};

export default AppRouter;