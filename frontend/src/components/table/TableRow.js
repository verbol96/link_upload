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
                return sum+el.amount*el.copies+"шт("+el.format+")ЛЮСТР "
            }else{
                return sum+el.amount*el.copies+"шт("+el.format+") "
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
    Сумма наложенного платежа: ${(Number(order.price)+Number(order.price_deliver)).toFixed(2)}р (с учетом пересылки)
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
    
    4255 1901 3053 1026
    12/26
    
    сумма ${order.price}р за заказ +2р пересылка. Итого ${(Number(order.price)+2).toFixed(2)}р
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

    const ShowData = () =>{

        const data = `${order.createdAt.split("T")[0].split("-")[2]}.${order.createdAt.split("T")[0].split("-")[1]}`
        const time = `${order.createdAt.split("T")[1].split(":")[0]}:${order.createdAt.split("T")[1].split(":")[1]}`
        return `${data} (${time})`
    }

    const ShowOrigin = () =>{
        switch(order.origin){
            case 'telegram': return <i style={{color: 'darkgreen'}} className="bi bi-send"></i>
            case 'website': return <i style={{color: 'darkgreen'}} className="bi bi-lightning-fill"></i>  
            case 'email': return <i style={{color: 'darkgreen'}} className="bi bi-envelope"></i>
            default:  return <i style={{color: 'darkgreen'}} className="bi bi-send"></i>
        }
    }

    return(
 
        <div 
            style={order.id === collapsedOrderId ? {backgroundColor: '#c5dce0'} : {}}
            className={`order_card_t${selectedOrder===order.id ? ' order_card_t_expanded' : ''}`}
            onClick={(e)=>handleClick(e)}
        >
            <div
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                onDoubleClick={()=>{ handleDetailsClick(order.id)}} 
                className={`order_card_main_t${selectedOrder===order.id ? ' order_card_main_t_expanded' : ''}`}>
                    <div className='col_origin' onClick={()=>handleDetailsClick(order.id)} >
                        {ShowOrigin()}
                    </div>
                    <div className='col_data' > {ShowData()}</div>
                    <CopyToClipboard text={order.typePost + (order.order_number%1000) +' ' + order?.user?.FIO}>
                    <div className='col_number' style={{color: 'darkgreen', fontWeight: 'bold', minWidth: 60}}>
                        {order.typePost + (order.order_number%1000) }
                    </div>
                    </CopyToClipboard>
                    <CopyToClipboard text={order.FIO}>
                        <div className='col_fio overflow NoMobile' >
                                {order?.user?.FIO}
                        </div>
                    </CopyToClipboard>
                    <div className='col_phone NoMobile' >
                        {formatPhoneNumber(order.phone)}
                    </div>
                    <div className='col_city overflow NoMobile'>{order.city}</div>
                    <div className='col_photo overflow '>{photo()}</div>
                    <div className='col_warn'>{Warning()}</div>
                    <CopyToClipboard text={copyCode()}>
                    <div className='col_price' >{(Number(order.price) + Number(order.price_deliver)).toFixed(2)}р</div>
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