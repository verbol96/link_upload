import './table.css'
import {Button, Col,Row, FormSelect, FormControl, Toast, FormCheck, FormLabel} from 'react-bootstrap'
import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import { LeftMenu } from '../admin/LeftMenu'
import { logout } from '../../http/authApi'
import {useDispatch} from 'react-redux'

export const TableMenu = ({setIsFormAdd, setSelectPost, selectPost, inputSearch, setInputSearch, filterCheck, setFilterCheck, editRow}) =>{

    const [show, setShow] = useState(false);
    const navigate = useNavigate()
    const dispach = useDispatch()

    const Check = (e, id) =>{
        if(e){
            setFilterCheck(filterCheck.concat(id))
        }else{
            setFilterCheck(
                filterCheck.filter(el=>!id.includes(el))
            )
        }

    }

    const AddForm = () =>{
        if(editRow === 0){
            setIsFormAdd(true)
        }
    }
    
    const Logout = async() =>{
        dispach({type: 'authStatus', paylods: false})
        await logout()
    }

    return(
        <div className="TableMenu">
            <LeftMenu />
            <Row style={{width: '103%'}}>
                <Col md={1} xs={2}>
                    <Button variant='dark' className='mt-2' style={{marginLeft: '5%', color: 'black', backgroundColor: 'DarkSlateGrey'}} size='sm' onClick={()=>dispach({type:'showLeftMenu'})}>
                        <i className="bi bi-list"></i>
                    </Button>
                </Col>
                <Col md={{span: 1, offset: 0}}  xs={{span: 2, offset: 0}}>
                    <Button size='sm' variant='dark' className='mt-2' style={{width: "100%"}} onClick={()=>{AddForm()}}>
                        <i className="bi bi-folder-plus"></i>
                    </Button>
                </Col>
                <Col md={2} xs={8}>
                    <FormControl  style={{backgroundColor: 'rgb(30, 52, 52)', color: 'white'}} size='sm' value={inputSearch} placeholder='поиск...' className='mt-2' onChange={(e)=>setInputSearch(e.target.value)} />
                </Col>
                <Col md={2} xs={8}>
                    <FormSelect style={{backgroundColor: 'rgb(30, 52, 52)', color: 'white'}} size='sm' className='mt-2' value={selectPost} onChange={(e)=>setSelectPost(e.target.value)} >
                        <option value={'All'}>Европочта и Белпочта</option>
                        <option value={"E"}>только Европочта</option>
                        <option value={"R"}>только Белпочта</option>
                    </FormSelect>
                </Col>
                
                <Col md={{span: 1, offset:3}} xs={1}>
                    <Button onClick={()=>navigate('/print')} size='sm' variant='dark' className='mt-2 printBtn' style={{width: "100%"}}>
                        <i className="bi bi-printer"></i>
                    </Button>
                </Col>
                <Col md={{span: 1}} xs={3}>
                    <Button size='sm' variant='dark' className='mt-2' style={{width: "100%"}} onClick={()=>setShow(!show)} >
                        <i className="bi bi-filter-square"></i>
                    </Button>
                    <Toast delay={10000} autohide animation={false} bg={'Light'.toLowerCase()} className='p-2' style={{position:"absolute", right:`${100/12}%`, top:43, width: 250, zIndex: 999}} onClose={() => setShow(false)} show={show}>
                        <Row>
                            <Col md={{span: 2, offset:2}}><FormCheck defaultChecked={true} onChange={(e)=>Check(e.target.checked, [1,2,3,4])} type="switch" /></Col>
                            <Col><FormLabel>в работе</FormLabel></Col>
                        </Row>
                        <Row>
                            <Col md={{span: 2, offset:2}}><FormCheck onChange={(e)=>Check(e.target.checked, [5])} type="switch" /></Col>
                            <Col><FormLabel>отправленные</FormLabel></Col>
                        </Row>
                        <Row>
                            <Col md={{span: 2, offset:2}}><FormCheck onChange={(e)=>Check(e.target.checked, [6])} type="switch" /></Col>
                            <Col><FormLabel>оплаченные</FormLabel></Col>
                        </Row>
                    </Toast>
                </Col>
                <Col>
                    <Button variant='dark' size='sm' className='mt-2' onClick={()=>Logout()}>выйти</Button>
                </Col>
            </Row>
        </div>
    )
}