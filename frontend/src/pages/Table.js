import { NavBar } from "../components/admin/NavBar"
import { TableFull } from "../components/table/TableFull"
import { Row, Col } from 'react-bootstrap'
import {useState} from 'react'

const Table = () =>{

    const [selectedOrder, setSelectedOrder] = useState(null); // выбранный заказ для полного отображения
    const [collapsedOrderId, setCollapsedOrderId] = useState(null) //для подсветки закрытого заказа
    
    const handleDetailsClick = (orderId) => { //состояние описания заказа
        if (selectedOrder === orderId) {
          setSelectedOrder(null);
        } else {
          setSelectedOrder(orderId);
        }
        setCollapsedOrderId(orderId);
    
        setTimeout(() => {
          setCollapsedOrderId(null);
        }, 3000); // Удалить подсветку через 2 секунды
      };

    return(
        <div style={{background: 'rgb(243, 243, 243)', minHeight: '100vh'}}>
           <NavBar />

            <Row className="d-flex justify-content-center" 
                onClick={()=>setSelectedOrder(null)}
            >
                <Col md={11}>
                    <TableFull selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder}
                        collapsedOrderId={collapsedOrderId} setCollapsedOrderId={setCollapsedOrderId}
                        handleDetailsClick={handleDetailsClick} />
                </Col>
            </Row>
           
            
        </div>
    )
}

export default Table