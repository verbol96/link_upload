import { Card, Row, Col, FormLabel, FormControl, FormSelect } from "react-bootstrap"
//import {useState} from 'react'

export const OtherForm = ({other, setOther})=>{

    return(
        <Card className="p-3 mt-3">
            <Row>
                <Col md={2}>
                    <FormLabel size='sm'>Для обратной связи:</FormLabel>
                </Col>
                <Col md={2}>
                        <FormSelect size="sm">
                            <option>instargram</option>
                            <option>telegram</option>
                            <option>viber</option>
                            <option>SMS</option>
                        </FormSelect>
                    </Col>
                <Col md={3}>
                    <FormControl size="sm" />
                </Col> 
            </Row>
            <Row className="mt-2">
                <Col md={2}>
                    <FormLabel size='sm'>Примечания:</FormLabel>
                </Col>
                <Col>
                    <FormControl value={other} onChange={(e)=>setOther(e.target.value)} size='sm' as="textarea" rows={3} />
                </Col>
            </Row>
        </Card>
    )
}