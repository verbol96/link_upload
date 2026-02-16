import Footer from "../components/admin/Footer"
import { NavBar } from "../components/admin/NavBar"
import { UserListNew } from "../components/users/UserListNew"

const Users = () =>{

    return(
        <div style={{display: 'flex', flexDirection: 'column',background: 'rgb(243, 243, 243)', minHeight: '100vh'}}>
            <NavBar />
            
            {
                //<UserList />
            }
            <UserListNew />
           
           <div style={{marginTop: 'auto'}}>
                <Footer />
            </div>
            
        </div>
    )
}

export default Users