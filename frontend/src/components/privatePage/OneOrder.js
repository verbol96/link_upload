import {Col, Row} from 'react-bootstrap'
import './OneOrder.css'

export const OneOrder = ({order, handleDetailsClick, selectedOrder}) =>{
    
    const descStatus =(id)=>{
        switch(id){
            case 1: return 'в обработке';
            case 2: return 'в обарботке';
            case 3: return 'в обарботке';
            case 4: return 'в обарботке';
            case 5: return 'в обарботке';
            case 6: return 'в обарботке';
            default: return 'не известно'
        }
    }

    const photoTable = (id) =>{
        const photo =  order.photos.filter(el=>el.orderId===id)
        return photo.reduce((sum, el)=>{
            
            return sum+el.amount
        
        }, 0)
    }

    return(
        <div className={`order_card${selectedOrder===order.id ? ' order_card_expanded' : ''}`}>
            <div className={`order_card_main${selectedOrder===order.id ? ' order_card_main_expanded' : ''}`}onClick={()=>handleDetailsClick(order.id)}>
                <div className='first_column'>
                    {selectedOrder===order.id ?
                    <i className="bi bi-chevron-up"  style={{color: 'white'}}></i>
                    :
                    <i className="bi bi-chevron-down"></i>
                    }
                </div>
                <div className='flex_grow'> {order.createdAt.split("T")[0].split("-")[2]}.{order.createdAt.split("T")[0].split("-")[1]}</div>
                <div className='flex_grow'>{order.codeInside}</div>
                <div className='flex_grow'>{order.city}</div>
                <div className='flex_grow'>{photoTable(order.id)}шт</div>
                <div className='flex_grow'>{order.price}р</div>
                <div className='flex_grow' style={{color: '#ae1959'}}><button className='status_btn'>{descStatus(order.status)}</button></div>
            </div>
            {
            selectedOrder===order.id ? 
           
            <div className='order_details'>
                <Row className='d-flex justify-content-center'>
                    <Col md={4}>
                        <div className='order_details_title'> Данные отправления</div>
                        <div className='order_details_desc'>
                            <div>ФИО: {order.FIO}</div>
                            <div>Телефон: {order.phone}</div>
                            <div style={{marginTop: 8}}><i className="bi bi-arrow-down-right-square"></i> {order.typePost==='E' ? 'Европочта' : 'Белпочта'}</div>
                            <div>Город: {order.city}</div>
                            
                            {order.typePost==='R' ? <div>Адрес: {order.adress}</div> : <div>Отделение: {order.adress}</div> }
                            {order.typePost==='R' ? <div>Индекс: {order.postCode}</div> : null }
                        </div>
                        
                    </Col>
                    <Col md={4}>
                        <div className='order_details_title'> Форматы фото </div>
                        <div className='order_details_desc'>
                        {order.photos.filter(el1=>el1.orderId===order.id).map(el2=>
                            <div key={el2.id}>{el2.format} - {el2.amount}шт {el2.type === 'photo' ? <>({el2.paper})</> : null}</div>)}
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className='order_details_title'> Изменения статуса <i className="bi bi-question-circle"></i></div>
                    </Col>
                    
                </Row>
                
            </div>

            :null
            }
        
        </div>
    )
}