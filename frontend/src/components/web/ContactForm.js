import {Row, Col, Tooltip, OverlayTrigger} from 'react-bootstrap'
import MaskedInput from 'react-text-mask';

export const ContactForm = ({FIO,setFIO,phone,setPhone,typePost,setTypePost,city,setCity,
    adress,setAdress,postCode,setPostCode})=>{

    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
           Именно эти данные мы указываем на посылке
        </Tooltip>
      );

      const phoneMask = [
        '+',
        '3',
        '7',
        '5',
        '(',
        /[0-9]/,
        /\d/,
        ')',
        ' ',
        /\d/,
        /\d/,
        /\d/,
        '-',
        /\d/,
        /\d/,
        '-',
        /\d/,
        /\d/
      ];
    

    return(
        <div className='contactForm'>
            <Row><h4 className='textH4'><i className="bi bi-2-square" style={{color: 'black', marginRight: 10}}></i> Данные для отправки 
            <OverlayTrigger
            placement="right"
            delay={{ show: 250, hide: 400 }}
            overlay={renderTooltip}
            >
            <i className="bi bi-question-circle icon-question-circle" ></i>
            </OverlayTrigger> </h4></Row>
            
            <Row>
                <Col md={3}>
                    <div className='containerInput'>
                    <label className='labelForm' >Телефон:</label>
                    <MaskedInput
                        mask={phoneMask}
                        className='inputForm' 
                        placeholderChar={'\u2000'}
                        showMask
                        guide={false}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    </div>    
                </Col>
                <Col md={{span: 3, offset:2}}>
                    <div className="containerSelect">
                    <label className="labelSelect">Тип отправки:</label>
                    <select className="selectForm" defaultValue={typePost} onChange={(e)=>setTypePost(e.target.value)}>
                            <option value={'E'}>Европочта</option>
                            <option value={'R'}>Белпочта</option>
                    </select>
                    <span className="selectArrow">▼</span>
                    </div>
                </Col>
            </Row>
            <Row className='mt-3'>
                <Col md={3}>
                    <div className='containerInput'>
                    <label className='labelForm' >ФИО:</label>
                    <input className='inputForm'  value={FIO} onChange={(e)=>setFIO(e.target.value)} />
                    </div>
                </Col>
                {typePost==='E'?<>
                <Col md={{offset: 2, span: 2}}>
                    <div className='containerInput'>
                    <label className='labelForm' >Город:</label>
                    <input className='inputForm'   value={city} onChange={(e)=>setCity(e.target.value)}  />
                    </div>
                </Col>
                <Col md={4}>
                    <div className='containerInput'>
                    <label className='labelForm' >Номер отделения (адрес):</label>
                    <input className='inputForm'  value={adress} onChange={(e)=>setAdress(e.target.value)}  />
                    </div>
                </Col>
                </>
                :
                <>
                <Col md={{offset: 2, span: 1}}>
                    <div className='containerInput'>
                    <label className='labelForm' >Индекс:</label>
                    <input className='inputForm'  value={postCode} onChange={(e)=>setPostCode(e.target.value)}   />
                    </div>
                </Col>
                <Col md={2}>
                    <div className='containerInput'>
                    <label className='labelForm' >Город:</label>
                    <input className='inputForm'  value={city} onChange={(e)=>setCity(e.target.value)}   />
                    </div>
                </Col>
                <Col>
                    <div className='containerInput'>
                    <label className='labelForm' >Адрес:</label>
                    <input className='inputForm' value={adress} onChange={(e)=>setAdress(e.target.value)}   />
                    </div>
                </Col>
                </>}
                
            </Row>
           
            
            
            </div>
    )
}