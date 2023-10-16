import {Row, Col} from 'react-bootstrap'
import './styleWeb.css'
import { useNavigate } from 'react-router-dom';

export const PageAfterUpload = ({amountPhoto, phone}) =>{

    const navigate = useNavigate();

    return(
        <div className='contactForm'>
            <Row>
                <Col className="mt-3">
                    <h4>Заказ отправлен!</h4>
                    <h5 style={{color: 'green'}}>Загружено {amountPhoto} фото.</h5>
                </Col>
            </Row>
            <Row className='mt-5'>
                <Col>
                    <h6>Проверить статус заказа можете в{' '}
                    <button 
                        style={{ textDecoration: 'underline', backgroundColor: 'transparent', border: 'none' }} 
                        onClick={()=>navigate("/PrivatePage")}
                    >
                            личном кабинете <i style={{color: 'black'}} className="bi bi-house-door"></i>
                        </button>
                        
                    </h6>
                    
                    <h6>Вернуться к  {' '}
                    <button 
                        style={{ textDecoration: 'underline', backgroundColor: 'transparent', border: 'none' }} 
                        onClick={()=>navigate("/web")}
                    >
                            форме заказа  <i style={{color: 'black'}} className="bi bi-arrow-90deg-left"></i>
                        </button>
                        
                    </h6> 

                    <h6 style={{fontSize: 12, marginTop: 50}}>*Восстановить(получить) логин-пароль можно написав нам в 
                        <a style={{color: 'black'}} href="https://www.instagram.com/link.belarus" target="_blank"  rel="noopener noreferrer"> Instagram </a>
                        либо 
                        <a style={{color: 'black'}} href="https://www.t.me/link_belarus" target="_blank"  rel="noopener noreferrer">  Telegram</a>.
                         Там же можно уточнить любую информацию о заказе.</h6>
                        
                </Col>
            </Row>
        </div>
    )
}