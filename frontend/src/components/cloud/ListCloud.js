import { useSelector } from "react-redux"
import { ListRow } from "./ListRow"
import './styleCloud.css'
import {Row, Col} from 'react-bootstrap'
import _ from 'lodash'


export const ListCloud=() =>{

    const files = _.orderBy(useSelector(state=>state.files.files), 'type', 'asc')
    

    return(
        <div className="tableList">
            <Row className='justify-content-center mb-3' style={{backgroundColor: "lightGray"}}>
                <Col md={1}>ID</Col>
                <Col md={4}>Имя файла</Col>
                <Col md={1}>Тип</Col>
                <Col md={2}>Размер</Col>
                <Col md={2}>Дата</Col>
                <Col md={1}></Col>
                <Col md={1}></Col>
            </Row>
            {files.map((el,index)=><ListRow el={el} key={index} />)}
        </div>
    )
}