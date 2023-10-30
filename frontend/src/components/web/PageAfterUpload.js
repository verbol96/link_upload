import {Row, Col} from 'react-bootstrap'
import './styleWeb.css'
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'

export const PageAfterUpload = ({amountPhoto, setStep, setFormats}) =>{

    const navigate = useNavigate();

    const toWeb = () =>{
        setStep(0)
        setFormats([
            {
                id: uuidv4(),
                type: 'photo',
                format: 'а6',
                paper: 'glossy',
                files: []
            }
        ])
    }

    return(
        <div className='contactForm pageAfterUpload'>
            <Row>
                <Col className="mt-3">
                    <h4>Спасибо за заказ!</h4>
                    <h6 style={{color: 'green'}}>Загружено {amountPhoto} фото.</h6>
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
                        onClick={()=>toWeb()}
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