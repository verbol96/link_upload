import {$host} from '../../http/index'
import { updateOrderStatus } from '../../store/orderReducer';
import './TableRow.css'
import { useDispatch } from 'react-redux';
import { DescRow } from './DescRow';
import {CopyToClipboard} from 'react-copy-to-clipboard'

export const TableRow = ({order, handleDetailsClick, selectedOrder, setSelectedOrder, collapsedOrderId, setCollapsedOrderId}) =>{

    const dispatch = useDispatch();

    const photo = () =>{
         return order.photos.reduce((sum, el)=>{
            if(el.paper==='lustre'){
                return sum+el.amount+"шт("+el.format+")ЛЮСТР "
            }else{
                return sum+el.amount+"шт("+el.format+") "
            }
        }, '')
    }

    const handleClick = (event) => {
        event.stopPropagation();
      };
      
      const copyCode = () =>{
        let text = ''
        
        if(order.typePost === 'E'){
            text = 
        `
        Здравствуйте. Заказ отправили. 
    Сумма наложенного платежа: ${order.price}р (с учетом пересылки)
    Код для отслеживания: ${order.codeOutside}
        `
        }
    
        if(order.typePost === 'R' && !order.firstClass){
            text = 
        `
        Здравствуйте. Заказ отправили. 
    Сумма наложенного платежа: ${order.price}р
    Код для отслеживания: ${order.codeOutside}
        `
        }
    
        if(order.typePost === 'R' && order.firstClass){
            text = 
        `
        Здравствуйте. Письмо отправили. Вот данные для оплаты:
    
    4255 1901 5302 8421
    12/23
    
    сумма ${order.price}р за заказ +2р пересылка. Итого ${Number(order.price)+2}р
    ${order.codeOutside} - код для отслеживания
        `
        }
        
    
        return text
    }

    const Warning = () =>{
        let a = []
        if(order.codeOutside){
            a.push(<CopyToClipboard text={order.codeOutside}>
                <i 
                className="bi bi-qr-code" 
                style={{marginLeft: 5}}
                > </i></CopyToClipboard>)
         }
        if(order.firstClass === true){
           a.push( <i className="bi bi-1-square-fill pr-1" style={{color:'red', marginLeft: 5}}> </i>)
        }
        if(order.notes){
            a.push( <i className="bi bi-exclamation-square-fill" style={{color: 'orange', marginLeft: 5}}> </i>)
         }
         if(order.other){
            a.push( <i className="bi bi-exclamation-square-fill" style={{color: 'yellowgreen', marginLeft: 5}}> </i>)
         }
         
        return a.map((el, index)=><span key={index}>{el} </span>)
    }

    const ColorBG = [
        '#97d0d6',// принят -1
        '#D8BFD8',//обработан -2
        '#FDFD96',// в печати -3
        '#98FF98',// упакован -4
        'DarkGrey',// отправлено -5
        'white'// оплачено -6
    ]

    const ChangeStatus = (event) =>{
        $host.put(`api/order/updateStatus/${order.id}`, {'status': event.target.value})
        dispatch(updateOrderStatus(order.id, event.target.value))
        
    }

    const formatPhoneNumber = (phoneNumberString) => {
        const cleaned = phoneNumberString.replace(/\D/g, '');
        const match = cleaned.match(/^375(\d{2})(\d{3})(\d{2})(\d{2})$/);
        if (match) {
          return '+375 (' + match[1] + ') ' + match[2] + '-' + match[3] + '-' + match[4];
        }
        return 'неверный номер';
      } 
    return(
 
        <div 
            style={order.id === collapsedOrderId ? {backgroundColor: '#c5dce0'} : {}}
            className={`order_card_t${selectedOrder===order.id ? ' order_card_t_expanded' : ''}`}
            onClick={(e)=>handleClick(e)}
        >
            <div
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                onDoubleClick={()=>handleDetailsClick(order.id)} 
                className={`order_card_main_t${selectedOrder===order.id ? ' order_card_main_t_expanded' : ''}`}>
                <div className='first_col' onClick={()=>handleDetailsClick(order.id)} >
                    {selectedOrder===order.id ?
                    <i className="bi bi-chevron-up"  style={{color: 'white'}}></i>
                    :
                    <i className="bi bi-chevron-down"></i>
                    }
                </div>
                <div className='flex_col_sm' > {order.createdAt.split("T")[0].split("-")[2]}.{order.createdAt.split("T")[0].split("-")[1]}</div>
                <CopyToClipboard text={order.typePost + (order.order_number%99+1) +' ' + order?.user?.FIO}>
                <div className='flex_col_sm' style={{color: 'darkgreen', fontWeight: 'bold'}}>
                    {order.typePost + (order.order_number%99+1)}
                </div>
                </CopyToClipboard>
                <div className='flex_col' >
                <CopyToClipboard text={order.FIO}>
                <div className='ellipsis'>
                    {order?.user?.FIO}
                </div>
                </CopyToClipboard>
                </div>
                <div className='flex_col phoneForMobile' style={{flex:2}} >
                    <div className='ellipsis'>
                    {formatPhoneNumber(order.phone)}
                    </div>
                </div>
                <div className='flex_col' style={{flex:2}}>{order.city}</div>
                <div className='flex_col' >
                    <div className='ellipsis'>
                    {photo()}
                    </div>
                </div>
                <div className='flex_col' style={{flex:1}} >{Warning()}</div>
                <CopyToClipboard text={copyCode()}>
                <div className='flex_col_sm' >{order.price}р</div>
                </CopyToClipboard>
                <select className="select_col" style={{backgroundColor: ColorBG[order.status-1]}} value={order.status} onChange={(e)=>ChangeStatus(e)} >
                    <option value="0">новый</option>
                    <option value="1">принят</option>
                    <option value="2">обработан</option>
                    <option value="3">в печати</option>
                    <option value="4">упакован</option>
                    <option value="5">отправлен</option>
                    <option value="6">оплачен</option>
                </select>
                </div>
                {
                selectedOrder===order.id 
                ? 
                <DescRow order={order} setSelectedOrder={setSelectedOrder} handleDetailsClick={handleDetailsClick}  />
                :null
                }
        </div>
            
    )
}