import {Row, Col , Tooltip, OverlayTrigger} from "react-bootstrap"
//import {useState} from 'react'
import './styleWeb.css'

export const OtherForm = ({other, setOther, typeAnswer, setTypeAnswer, nikname, setNikname})=>{
    
    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            Здесь можете указать нестандартные размеры, рамки и прочие пожелания
        </Tooltip>
      );

    return(
        <div className="otherForm">
            <Row><h4 className='textH4'><i className="bi bi-3-square" style={{color: 'black', marginRight: 10}}></i> Примечания 
            <OverlayTrigger
            placement="right"
            delay={{ show: 250, hide: 400 }}
            overlay={renderTooltip}
            >
            <i className="bi bi-question-circle icon-question-circle"></i>
            </OverlayTrigger> </h4></Row>

            <Row className="mt-2">
                <Col>
                <div className='containerInput'>
                <label className='labelForm'>Примечания:</label>
                <textarea rows={4} className='textareaForm' onChange={(e) => setOther(e.target.value)}></textarea>
                </div>
                </Col>  
            </Row>
        </div>
    )
}