import { NavBarAdmin } from "../components/admin/NavBarAdmin"
import Footer from "../components/admin/Footer"
import { UserList } from "../components/users/UserList"

const Users = () =>{

    return(
        <div style={{display: 'flex', flexDirection: 'column',background: 'rgb(243, 243, 243)', minHeight: '100vh'}}>
           <NavBarAdmin />

            <UserList />
           
           <div style={{marginTop: 'auto'}}>
                <Footer />
            </div>
            
        </div>
    )
}

export default Users