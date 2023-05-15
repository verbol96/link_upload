import {useNavigate} from 'react-router-dom'
import {useSelector} from 'react-redux'
import {Button} from 'react-bootstrap'
import {Table, Col, Row, FormControl} from 'react-bootstrap'

const Print = () =>{

    const navigate = useNavigate()
    const user = useSelector(state=>state.order.printList)

    console.log(user)
    return(
        <div>
        <Button md={2} variant='secondary' onClick={()=>navigate('/table')}>close</Button>
        <Row>
            {user.map(el=>
            <Col md={6} className='p-5'>
                <Table style={{border: '1px solid black'}}>
                    <tbody>
                        <tr>
                            <td style={{ textAlign: 'center'}}>Кому:</td>
                            <td><FormControl size='sm' defaultValue={el.name} style={{border: 'none', outline: 'none', textAlign: 'center'}} /></td>
                        </tr>
                        <tr>
                            <td colSpan={2}><FormControl size='sm' style={{border: 'none', outline: 'none', textAlign: 'center'}} /></td>
                        </tr>
                        <tr>
                            <td style={{ textAlign: 'center'}}>Куда:</td>
                            <td><FormControl size='sm' defaultValue={el.adress} style={{border: 'none', outline: 'none', textAlign: 'center'}} /></td>
                        </tr>
                        <tr>
                            <td style={{border: '1px solid black', width:'20%'}}><FormControl size='sm' defaultValue={el.postCode} style={{border: 'none', outline: 'none', textAlign: 'center'}} /></td>
                            <td><FormControl size='sm' defaultValue={el.city} style={{border: 'none', outline: 'none'}} /></td>
                        </tr>
                        <tr>
                            <td colSpan={2}><FormControl size='sm' defaultValue={el.raion + " район"} style={{border: 'none', outline: 'none', textAlign:'center'}} /></td>
                        </tr>
                        <tr>
                            <td colSpan={2}><FormControl size='sm' defaultValue={el.oblast + " область"} style={{border: 'none', outline: 'none', textAlign:'center'}} /></td>
                        </tr>
                        <tr>
                            <td style={{width:'20%'}}>телефон: </td>
                            <td><FormControl size='sm' defaultValue={el.phone} style={{border: 'none', outline: 'none'}} /></td>
                        </tr>
                    </tbody>
                </Table>
                </Col>
            )}
            </Row>
            
            </div>
    )
}

export default Print