import {useSelector, useDispatch} from 'react-redux'
import {useEffect, useState} from 'react'
import {Table, Button, FormControl, Row, Col} from 'react-bootstrap'
import { NavBar } from '../components/admin/NavBar'
import {$host} from '../http/index'

const UsersDB = () =>{

    const dispach = useDispatch()

   useEffect(()=>{
    
    $host.get('api/order/getAll').then(
        res=> {
            dispach({type: "saveUser", payload: res.data.user})
            dispach({type: "saveOrder", payload: res.data.order})
        }
    )
    },[ dispach])
    const usersFull = useSelector(state=>state.order.user)
    const orders = useSelector(state=>state.order.order)

    const Delete = (id) =>{
        $host.delete(`api/order/deleteUser/${id}`)
    }

    const isOrder = (id)=>{
        const a = orders.filter(el=>el.userId===id)
        if(a.length>0)return false
        const b = user.filter(el=>el.id===id)
        if(b[0].password!==null)return false
        else return true
    }
    const [input, setInput] = useState('')
    const user = usersFull.filter(el=>{
        const a = el.phone + el.name +el.nikname
        return a.toLowerCase().includes(input.toLowerCase())
    })
    
    return (
        <>
            <NavBar />
            <Row>
                <Col className='m-3' md={3} xs={9}>
                    <FormControl  placeholder="поиск..." value={input} onChange={(e)=>setInput(e.target.value)} />
                </Col>
            </Row>
            <Row>
                <Col className='m-3'>
                    <Table responsive>
                        <tbody>
                            

                        {user.map((el, index)=><tr key={index} style={{fontSize: 12}}>
                            <td>{el.name}</td>
                            <td>{el.nikname}</td>
                            <td>{el.phone}</td>
                            {isOrder(el.id)?<>
                                <td><Button size='sm' onClick={()=>Delete(el.id)} variant='success' style={{height: 25}}>удалить</Button></td>
                                <td>заказов нет</td></>
                                :<>
                                <td><Button disabled size='sm' onClick={()=>Delete(el.id)} variant='light' style={{backgroundColor:'black', color: 'white', height: 25}}>удалить</Button></td>
                                <td>не получится, имеются заказы</td></>
                            }

                        </tr>)}
                        </tbody>
                    </Table>
                </Col>
            </Row>
            
            
        </>
    )
}

export default UsersDB