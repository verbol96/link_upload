import { NavBarAdmin } from "../components/admin/NavBarAdmin"
import { Pricing } from "../components/settings/Pricing"

const Setting = () =>{

   
    return (
        <div>
            <NavBarAdmin />
            <h3 style={{display:'flex', justifyContent:'start', margin: 30}}>Настройки</h3>
            
            <Pricing />
        </div>
    )
}

export default Setting

