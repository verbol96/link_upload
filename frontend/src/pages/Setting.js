import { NavBar } from "../components/admin/NavBar"
import { Pricing } from "../components/settings/Pricing"

const Setting = () =>{

   
    return (
        <div>
            <NavBar />
            <h3 style={{display:'flex', justifyContent:'start', margin: 30}}>Настройки</h3>
            
            <Pricing />
        </div>
    )
}

export default Setting

