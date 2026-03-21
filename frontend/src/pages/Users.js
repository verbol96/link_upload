import Footer from "../components/admin/Footer"
import { NavBar } from "../components/admin/NavBar"
import { UserList } from "../components/users/UserList"

const Users = () =>{

    return(
        <div className="h-screen flex flex-col">
            <NavBar />

            <div className="flex-1 min-h-0">
                <UserList />
            </div>
            
            <Footer />
            
        </div>
    )
}

export default Users