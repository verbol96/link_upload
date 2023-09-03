import { useState } from "react"
import { MyOrders } from "../components/privatePage/MyOrders";
import { Settings } from "../components/privatePage/Settings";
import { Files } from "../components/privatePage/Files";
import { NavBar } from "../components/privatePage/NavBar";
import Footer from "../components/admin/Footer"
import './stylePages.css'

const PrivatePage = () =>{



    const [selectedMenuItem, setSelectedMenuItem] = useState('мои заказы');
  
    const handleMenuItemClick = (menuItem) => {
      setSelectedMenuItem(menuItem);
    };

    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f6f6fa'}}>

            <NavBar onMenuItemClick={handleMenuItemClick} selectedMenuItem={selectedMenuItem} />
        
            <div className="my-row">
                <div className="my-col">
                    {selectedMenuItem === 'мои заказы' && <MyOrders />}
                    {selectedMenuItem === 'настройки' && <Settings />}
                    {selectedMenuItem === 'файлы' && <Files />}
                </div>
            </div>
        
            <div style={{marginTop: 'auto'}}>
                <Footer />
            </div>
        
        </div>
    )
}

export default PrivatePage

