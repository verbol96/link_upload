import { TableFull } from "../components/table/TableFull"
import {useState} from 'react'
import Footer from "../components/admin/Footer"
import { NavBar } from "../components/admin/NavBar"
import style from './Table.module.css'

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
        <div style={{display: 'flex', flexDirection: 'column',background: 'rgb(243, 243, 243)', minHeight: '100vh'}}>
           <NavBar />

            <div className={style.row} onClick={()=>setSelectedOrder(null)}>
                <div className={style.col}>
                    <TableFull selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder}
                        collapsedOrderId={collapsedOrderId} setCollapsedOrderId={setCollapsedOrderId}
                        handleDetailsClick={handleDetailsClick} />
                </div>
            </div>
           
           
            <Footer />
            
        </div>
    )
}

export default Table