import { TableFull } from "../components/table/TableFull"
import {useState} from 'react'
import Footer from "../components/admin/Footer"
import { NavBar } from "../components/admin/NavBar"
import style from './Table.module.css'

const Table = () =>{

    const [selectedOrder, setSelectedOrder] = useState(null); // выбранный заказ для полного отображения
    const [collapsedOrderId, setCollapsedOrderId] = useState(null) //для подсветки закрытого заказа
    const [isChanged, setIsChanged] = useState(false);
    
    const handleDetailsClick = (orderId) => { //состояние описания заказа
        
        if(orderId==='save') {
          setSelectedOrder(null)
          setIsChanged(false)
          return;
        }
         
        if (selectedOrder === orderId || isChanged) {
          const confirmClose = isChanged ? window.confirm('Закрыть без сохранения?') : true;
        
          if (confirmClose) {
            setSelectedOrder(selectedOrder === orderId ? null : orderId);
            setIsChanged(selectedOrder === orderId ? null : true)
          }
        } else {
          setSelectedOrder(orderId);
        }

        setCollapsedOrderId(orderId);
        setTimeout(() => {
          setCollapsedOrderId(null);
        }, 3000); // Удалить подсветку через 2 секунды
      };

    const CloseOrder = () =>{
      if(selectedOrder===null) return;
      
      if (!isChanged || window.confirm('Закрыть без сохранения?')) {
        setSelectedOrder(null);
        setIsChanged(false)
      }

      
    }
 
    return(
        <div style={{display: 'flex', flexDirection: 'column',background: 'rgb(243, 243, 243)', minHeight: '100vh'}}>
           <NavBar />

            <div className={style.row} onClick={()=>CloseOrder()}>
                <div className={style.col}>
                    <TableFull selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder}
                        collapsedOrderId={collapsedOrderId} setCollapsedOrderId={setCollapsedOrderId}
                        handleDetailsClick={handleDetailsClick}
                        isChanged={isChanged} setIsChanged={setIsChanged} />
                </div>
            </div>
           
           
            <Footer />
            
        </div>
    )
}

export default Table