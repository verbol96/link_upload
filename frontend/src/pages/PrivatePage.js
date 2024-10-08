import { useState } from "react"
import Footer from "../components/admin/Footer"
import style from './PrivatePage.module.css'
import { NavBar } from "../components/admin/NavBar";
import {useSelector} from 'react-redux'
import { ChangeData } from "../components/privatePage/ChangeData";
import { MyOrdersUser } from "../components/privatePage/MyOrdersUser";
import { MyOrdersAdmin } from "../components/privatePage/MyOrdersAdmin";
import { MyFiles } from "../components/privatePage/MyFiles";

const PrivatePage = () =>{

    //const menu = ['Мои заказы', 'Личные данные', 'Мои файлы']
    const menu = ['Мои заказы', 'Личные данные']
    const user = useSelector(state=>state.private.user)

    const [item, setItem] = useState(0)

    const ShowMenuItem = () =>{
        switch(item){
            case(0): 
                {   if(user.role==='USER') return <MyOrdersUser />
                    return <MyOrdersAdmin />
                }
            case(1): return <ChangeData />
            //case(2): return <MyFiles />
            default: return <MyOrdersUser />

        }
    }

    const ShowUser = () =>{
        if(!user.FIO) return user.phone
        const splitUser = user.FIO.split(' ')
        if(splitUser.length>1) return splitUser[0]+' '+splitUser[1]
        if(splitUser.length===1) return splitUser[0]
        
    }
 
    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f6f6fa'}}>
            <NavBar />
            <div className={style.container}> 
                <div className={style.menuList}>
                    <div className={style.menuListPhone}>{ShowUser()}</div>
                    <div className={style.menuListItem}>
                        {menu.map((el,index)=><div className={style.menuItem} style={{background: item===index && '#116466',color: item===index && 'white'}} key={index} onClick={()=>{setItem(index)}}>{el}</div>)}
                     </div>
                </div>
                <div className={style.menuContent}>
                    {ShowMenuItem()}
                </div>
            </div>
        
           
        
            <div style={{marginTop: 'auto'}}>
                <Footer />
            </div>
        
        </div>
    )
}

export default PrivatePage

