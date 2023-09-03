import {Row, Col} from 'react-bootstrap'
import './styleWeb.css'

export const PageAfterUpload = ({amountPhoto, phone}) =>{
    return(
        <div className='contactForm'>
            <Row>
                <Col className="mt-3">
                    <h4>Заказ отправлен</h4>
                    <h5 style={{color: 'green'}}>Загружено {amountPhoto} фото.</h5>
                </Col>
            </Row>
            <Row className='mt-5'>
                <Col>
                    <h5>Проверить статус заказа можете в личном кабинете:</h5>
                    <h6>Логин: {phone}</h6>
                    <h6>Стартовый пароль: 1</h6>
                </Col>
            </Row>
        </div>
    )
}