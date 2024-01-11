import Footer from "../components/admin/Footer"
import { UserList } from "../components/users/UserList"
import { NavBar } from "../components/admin/NavBar"

const Users = () =>{

    return(
        <div style={{display: 'flex', flexDirection: 'column',background: 'rgb(243, 243, 243)', minHeight: '100vh'}}>
            <NavBar />

            <UserList />
           
           <div style={{marginTop: 'auto'}}>
                <Footer />
            </div>
            
        </div>
    )
}

export default Users