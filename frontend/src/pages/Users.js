import { NavBarAdmin } from "../components/admin/NavBarAdmin"
import {useState} from 'react'
import Footer from "../components/admin/Footer"
import {useSelector} from 'react-redux'

const Users = () =>{



    return(
        <div style={{display: 'flex', flexDirection: 'column',background: 'rgb(243, 243, 243)', minHeight: '100vh'}}>
           <NavBarAdmin />

           
           <div style={{marginTop: 'auto'}}>
                <Footer />
            </div>
            
        </div>
    )
}

export default Users