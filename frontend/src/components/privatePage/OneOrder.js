
import './OneOrder.css'
import { OneOrderDesc } from './OneOrderDesc';

export const OneOrder = ({order, handleDetailsClick, selectedOrder, setSelectedOrder}) =>{
    
    const formatPhoneNumber = (phoneNumberString) => {
        const cleaned = phoneNumberString.replace(/\D/g, '');
        const match = cleaned.match(/^375(\d{2})(\d{3})(\d{2})(\d{2})$/);
        if (match) {
          return '+375 (' + match[1] + ') ' + match[2] + '-' + match[3] + '-' + match[4];
        }
        return 'неверный номер';
      }

      const photo = () =>{
        return order.photos.reduce((sum, el)=>{
           if(el.paper==='lustre'){
               return sum+el.amount+"шт("+el.format+")ЛЮСТР "
           }else{
               return sum+el.amount+"шт("+el.format+") "
           }
       }, '')
   }

   const StatusOrder = [
    'новый',// принят -1
    'принят',//обработан -2
    'готов к печати',// в печати -3
    'в печати',// упакован -4
    'упакован',// отправлено -5
    'отправлен',// оплачено -6
    'отправлен'
]

    return(
        <div className={`order_card${selectedOrder===order.id ? ' order_card_expanded' : ''}`}>
            <div className={`order_card_main_t${selectedOrder===order.id ? ' order_card_main_t_expanded' : ''}`}onClick={()=>handleDetailsClick(order.id)}>
                <div className='first_col'>
                    {selectedOrder===order.id ?
                    <i className="bi bi-chevron-up"  style={{color: 'white'}}></i>
                    :
                    <i className="bi bi-chevron-down"></i>
                    }
                </div>
                <div className='flex_col_sm'> {order.createdAt.split("T")[0].split("-")[2]}.{order.createdAt.split("T")[0].split("-")[1]}</div>
                <div className='flex_col'>{order?.FIO}</div>
                <div className='flex_col' style={{flex:2}}>{formatPhoneNumber(order.phone)}</div>
                <div className='flex_col' style={{flex:2}}>{order.city}</div>
                <div className='flex_col'>{photo()}</div>
                <div className='flex_col_sm'>{order.price}р</div>
                <div className='flex_col' style={{flex:1.3}}><button style={{backgroundColor: order.status === 5 || order.status === 6 ? '#b7cbcf' : '#cbd36b', 
                                                                            border: order.status===5|| order.status === 6 ? '2px solid #a0babf' : '2px solid #b2b77a', 
                                                                            borderRadius: 5, whiteSpace:'nowrap', width:'100%'}}>{StatusOrder[order.status]}</button></div>
                </div>
            {
            selectedOrder===order.id ? 
           
            <OneOrderDesc order={order} setSelectedOrder={setSelectedOrder} handleDetailsClick={handleDetailsClick}
            StatusOrder={StatusOrder} />

            :null
            }
        
        </div>
    )
}