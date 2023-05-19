import {Card, Row, Col, FormControl, FormLabel, FormSelect} from 'react-bootstrap'

export const ContactForm = ({name,setName,phone,setPhone,typePost,setTypePost,city,setCity,adress,setAdress,postCode,setPostCode})=>{

    return(
        <Card className='mt-3 p-3'>
            <Row>
                <Col md={3}>
                    <Row>
                        <Col> <FormLabel>Телефон:</FormLabel></Col>
                    </Row>
                    <Row>
                        <Col><FormControl size='sm' value={phone} onChange={(e)=>setPhone(e.target.value)} /> </Col>
                    </Row>    
                </Col>
                <Col md={{span: 3, offset:2}}>
                    <Row>
                        <Col> <FormLabel>Тип отправки:</FormLabel></Col>
                    </Row>
                    <Row>
                        <Col><FormSelect  size='sm' defaultValue={typePost} onChange={(e)=>setTypePost(e.target.value)}>
                                <option value={'E'}>Европочта</option>
                                <option value={'R'}>Белпочта</option>
                     </FormSelect> </Col>
                    </Row> 
                    
                </Col>
            </Row>
            <Row className='mt-3'>
                <Col md={3}>
                    <FormLabel>ФИО:</FormLabel>
                    <FormControl size='sm'  value={name} onChange={(e)=>setName(e.target.value)} /> 
                </Col>
                {typePost==='E'?<>
                <Col md={{offset: 2, span: 2}}>
                <FormLabel>Город:</FormLabel>
                    <FormControl size='sm' value={city} onChange={(e)=>setCity(e.target.value)} /> 
                </Col>
                <Col md={4}>
                    <FormLabel>Номер отделения (адрес):</FormLabel>
                    <FormControl size='sm' value={adress} onChange={(e)=>setAdress(e.target.value)} />
                </Col>
                </>
                :
                <>
                <Col md={{offset: 2, span: 1}}>
                    <FormLabel>Индекс:</FormLabel>
                    <FormControl size='sm' value={postCode} onChange={(e)=>setPostCode(e.target.value)} /> 
                </Col>
                <Col md={2}>
                    <FormLabel>Город:</FormLabel>
                    <FormControl size='sm' value={city} onChange={(e)=>setCity(e.target.value)} /> 
                </Col>
                <Col>
                    <FormLabel>Адрес:</FormLabel>
                    <FormControl size='sm' value={adress} onChange={(e)=>setAdress(e.target.value)} />
                </Col>
                </>}
                
            </Row>
            
            </Card>
    )
}