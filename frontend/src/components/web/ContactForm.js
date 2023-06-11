import {Card, Row, Col} from 'react-bootstrap'

export const ContactForm = ({name,setName,phone,setPhone,typePost,setTypePost,city,setCity,adress,setAdress,postCode,setPostCode})=>{

    return(
        <Card className='mt-3 p-3'>
            <Row>
                <Col md={3}>
                    <div className='containerInput'>
                    <label className='labelForm' >Телефон:</label>
                    <input className='inputForm' value={phone} onChange={(e)=>setPhone(e.target.value)} />
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
                    <input className='inputForm'  value={name} onChange={(e)=>setName(e.target.value)} />
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
           
            
            
            </Card>
    )
}