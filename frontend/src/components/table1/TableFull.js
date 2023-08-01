import {React, useEffect, useState} from 'react'
import {Table, Row, Col} from 'react-bootstrap'
import {useSelector, useDispatch} from 'react-redux'
import { TableRow } from './TableRow'
import { FormAdd } from './FormAdd'
import { TableMenu } from './TableMenu'
import _ from 'lodash'
import {$host} from '../../http/index'


export const TableFull = () =>{

    const dispach = useDispatch()
    const [isFormAdd, setIsFormAdd] = useState(false)
    const [selectPost, setSelectPost] = useState("All")
    const [inputSearch, setInputSearch] = useState('')
    const [filterCheck, setFilterCheck] = useState([1,2,3,4])

    const loading =(res)=>{
        dispach({type: "saveOrder", payload: _.orderBy(_.orderBy(res.data.order, 'id', 'desc' ), 'status', 'asc' )})
        dispach({type: "saveUser", payload: res.data.user})
        dispach({type: "savePhoto", payload: res.data.photo})
        dispach({type: "saveAdress", payload: res.data.adress})
    }

    useEffect(()=>{

        $host.get('api/order/getAll').then(
            res=> {
                dispach({type: "saveOrder", payload: _.orderBy(_.orderBy(res.data.order, 'id', 'desc' ), 'status', 'asc' )})
                dispach({type: "saveUser", payload: res.data.user})
                dispach({type: "savePhoto", payload: res.data.photo})
                dispach({type: "saveAdress", payload: res.data.adress})
            }
        )
        
    },[isFormAdd, dispach])

    const orderFull = useSelector(state=>state.order.order)
    const user = useSelector(state=>state.order.user)
    const photo = useSelector(state=>state.order.photo)
    const adress = useSelector(state=>state.order.adress)
    const editRow = useSelector(state=>state.order.editRow)

    
    const OrderList = () =>{

        //фильтор по чекбоксу
        let order = orderFull.filter(s=>filterCheck.includes(Number(s.status)))
        //фильтор по поиску
        order = order.filter(el=>{
            const user1 = user.filter(step=>step.id=== el.userId)[0]
            const adress1 = adress.filter(step=>step.id=== el.adressId)[0]
            const str = adress1.city.toString()+user1.nikname.toString()+user1.phone.toString()
            return str.toLowerCase().includes(inputSearch.toLowerCase() )
        })
        //фильтор по типу почты
        switch(selectPost){
            case 'E': return order.filter(el=>{
                const adress1 = adress.filter(step=>step.id=== el.adressId)[0]
                if(adress1.typePost==="E"){
                    return true
                    } else return false
            })
            case 'R': return order.filter(el=>{
                const adress1 = adress.filter(step=>step.id=== el.adressId)[0]
                if(adress1.typePost==="R"){
                    return true
                    } else return false
            })
            default: {
                return order
            }
            
        }
        
    }
    
    const SumPrice = () =>{
        const pr =  OrderList().reduce((sum,el)=>{
            return sum+Number(el.price)
        },0)
       
        return pr
    }
    const SumFormat = () =>{
        const pr =  OrderList().reduce((sum,el)=>{
            const photo1=photo.filter(step=>step.orderId === el.id)
            return sum+ 
                photo1.reduce((sum1,el1)=>{
                return sum1+Number(el1.amount)
                },0)
            
        },0)
       
        return pr

    }
    const [indexR, setIndexR] = useState(0) //для прокрутки модального окна
    const nextShow = (k) =>{

        let i =0
        OrderList().forEach((el, index)=>{
            if(editRow.id ===el.id){
                setIndexR(index)
                return i=index
            } 
            }
        )
        
        const next = OrderList().filter((el,index)=>(index+k) ===i)[0]
        if (typeof next !== "undefined" && next !== null){
            dispach({type: "editRow", payload: next})
            setIsFormAdd(false)
            setTimeout(()=>setIsFormAdd(true), 100)
        }
    }
    
    return(
        <>
        <TableMenu setIsFormAdd={setIsFormAdd} selectPost= {selectPost} setSelectPost={setSelectPost} editRow={editRow}
        inputSearch={inputSearch} setInputSearch={setInputSearch} filterCheck={filterCheck} setFilterCheck={setFilterCheck} />
        <Row className='justify-content-center' style={{backgroundColor: "rgb(232, 232, 232)", minHeight: 1000, width: '103%', overflow: 'hidden'}}>
        <Col md={10} xs={12} style={{paddingRight: 0}} >
        <Table responsive size='sm' className='mt-4' bordered hover  style={{backgroundColor:"white", width: '100%'}} >
            
            <tfoot style={{backgroundColor:"Silver"}}>
            <tr>
                <td></td>
                <td></td>
                <td style={{fontSize: 11}}>K={OrderList().length}</td>
                <td></td>
                <td></td>
                <td></td>
                <td style={{fontSize: 11}}>N={SumFormat()}шт</td>
                <td></td>
                <td style={{ textAlign:'right', fontFamily: "Geneva", fontSize:10}}>S={SumPrice().toFixed(2)}</td>
                <td></td>
            </tr>
            </tfoot>
            <tbody>
                {OrderList().map((el,index)=><TableRow key={index} el={el} user={user.filter(step=>step.id === el.userId)[0]} 
                adressOrder={adress.filter(step=>step.id === el.adressId)[0]} isFormAdd={isFormAdd}
                    setIsFormAdd={setIsFormAdd} photo={photo.filter(step=>step.orderId === el.id)} loading={loading} />)}
            </tbody>
         </Table>
        </Col>
        </Row>

        {isFormAdd?<FormAdd isFormAdd={isFormAdd} setIsFormAdd={setIsFormAdd} user={user.filter(el=>el.id === editRow.userId)[0]}
        adressOrder={adress.filter(el=>el.id === editRow.adressId)[0]} loading={loading} editRow={editRow} photoAll={photo}
        nextShow={nextShow} indexR={indexR} />:null}

        </>
    )
}

