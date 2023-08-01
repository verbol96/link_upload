import { useState } from "react"
import {Col, Row} from 'react-bootstrap'
import { MyOrders } from "../components/privatePage/MyOrders";
import { Settings } from "../components/privatePage/Settings";
import { Files } from "../components/privatePage/Files";
import { NavBar } from "../components/privatePage/NavBar";

const PrivatePage = () =>{



    const [selectedMenuItem, setSelectedMenuItem] = useState('мои заказы');
  
    const handleMenuItemClick = (menuItem) => {
      setSelectedMenuItem(menuItem);
    };

    return (
        <div style={{background: '#f6f6fa', minHeight: '100vh'}}>

            <NavBar onMenuItemClick={handleMenuItemClick} selectedMenuItem={selectedMenuItem} />

            <Row className="justify-content-center">
            
                <Col md={11} className="mt-3">
                    {selectedMenuItem === 'мои заказы' && <MyOrders />}
                    {selectedMenuItem === 'настройки' && <Settings />}
                    {selectedMenuItem === 'файлы' && <Files />}
                </Col>
            </Row>
        </div>
    )
}

export default PrivatePage

