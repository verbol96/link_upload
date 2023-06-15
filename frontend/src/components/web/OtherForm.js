import { Card, Row, Col , Tooltip, OverlayTrigger} from "react-bootstrap"
//import {useState} from 'react'

export const OtherForm = ({other, setOther, typeAnswer, setTypeAnswer, nikname, setNikname})=>{
    
    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
           Укажите, где вам удобнее получать уведомления о статусе заказа
        </Tooltip>
      );

    return(
        <Card className="otherForm">
            <Row><h4 className='textH4'><i className="bi bi-3-square" style={{color: 'black', marginRight: 10}}></i> Обратная связь 
            <OverlayTrigger
            placement="right"
            delay={{ show: 250, hide: 400 }}
            overlay={renderTooltip}
            >
            <i className="bi bi-question-circle icon-question-circle"></i>
            </OverlayTrigger> </h4></Row>
            <Row>
                <Col md={2}>
                    <div className="containerSelect">
                    <label className="labelSelect">Соц. сеть:</label>
                    <select className="selectForm" value={typeAnswer} onChange={(e)=>setTypeAnswer(e.target.value)}>
                            <option>instargram</option>
                            <option>telegram</option>
                            <option>viber</option>
                    </select>
                    <span className="selectArrow">▼</span>
                    </div>
                    </Col>
                <Col md={3}>
                <div className='containerInput'>
                    <label className='labelForm' >Ссылка, никнейм или номер:</label>
                    <input className='inputForm' value={nikname} onChange={(e)=>setNikname(e.target.value)} />
                    </div>  
                </Col> 
            </Row>
            <Row className="mt-2">
                <Col>
                <div className='containerInput'>
                <label className='labelForm'>Примечания:</label>
                <textarea className='textareaForm' onChange={(e) => setOther(e.target.value)}></textarea>
                </div>
                </Col>  
            </Row>
        </Card>
    )
}