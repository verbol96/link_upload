import {Modal, Button, Row, Col,  FormLabel, FormControl , FormSelect, Card, Form, FormCheck, Alert} from 'react-bootstrap'
import {useState} from 'react'
import './table.css'
import { useDispatch} from 'react-redux'
import {nanoid} from 'nanoid'
import { FormatAll } from './FormatAll'
import {CopyToClipboard} from 'react-copy-to-clipboard'
import useKeypress from 'react-use-keypress'
import {$host} from '../http/index'


export const FormAdd = ({isFormAdd, setIsFormAdd, user, adressOrder, loading, path, editRow, photoAll, nextShow, indexR}) =>{


    
    window.scrollTo(0, indexR*100-1000)  //прокурутка при модальном окне

    const dispach = useDispatch()
    
    const [show, setShow] = useState(false);
    const [status, setStatus] = useState( editRow.id>0 ? editRow.status : '1')

    const [userId] = useState( editRow.id>0 ? user.id : '')
    const [adressId] = useState( editRow.id>0 ? adressOrder.id : '')

    const [name, setName] = useState( editRow.id>0 ? user.name : ' ')
    const [nikname, setNikname] = useState( editRow.id>0 ? user.nikname : ' ')
    const [phone, setPhone] = useState(editRow.id>0 ? user.phone : ' ')

    const [typePost, setTypePost] = useState(editRow.id>0 ? adressOrder.typePost : 'E')
    const [city, setCity] = useState(editRow.id>0 ? adressOrder.city : '')
    const [adress, setAdress] = useState(editRow.id>0 ? adressOrder.adress : '')

    const [oblast, setOblast] = useState(editRow.id>0 ? adressOrder.oblast : '')
    const [raion, setRaion] = useState(editRow.id>0 ? adressOrder.raion : '')
    const [postCode, setPostCode] = useState(editRow.id>0 ? adressOrder.postCode : '')
    const [firstClass, setFirstClass] = useState(editRow.id>0 ? adressOrder.firstClass : false)
    
    const [other, setOther] =useState(editRow.id>0 ? editRow.other : '')
    const [codeInside] =useState(editRow.id>0 ? editRow.codeInside : nanoid(6))
    const [codeOutside, setCodeOutside] =useState(editRow.id>0 ? editRow.codeOutside : '')
    const [price, setPrice] =useState(editRow.id>0 ? editRow.price : 0)

    const [photo, setPhoto] = useState(editRow.id>0 ? photoAll.filter(el=>el.orderId===editRow.id) :[])
  
    const SendToDB = () =>{
        const data = {
            "name": name,
            "nikname": nikname,
            "phone": phone,
            "typePost": typePost,
            "city": city,
            "adress": adress,
            "oblast": oblast,
            "raion": raion,
            "postCode": postCode,
            "photo": photo, 
            "userId": userId,
            "adressId": adressId,
            "other":other,
            "codeInside": codeInside,
            "codeOutside": codeOutside,
            "price": price,
            "firstClass": firstClass
        }


        editRow.id>0 ?
        $host.put(`api/order/updateOrder/${editRow.id}`, data).then(()=>{
            $host.get('api/order/getAll').then(
            res=> { loading(res)}
        )})
        : 
        $host.post('api/order/addOrder', data).then(()=>{
            $host.get('api/order/getAll').then(
                res=> { loading(res)}
        )})

        if(editRow.id>0 ) ChangeStatus()
        
        ModalClose()
    }

    const ModalClose = () =>{

        setIsFormAdd(false)
        setTimeout(()=>{
            dispach({type:"editRow", payload: 0})
        }, 1500) //время подсветки строки
    }

    const DeleteBtn = () =>{
        $host.delete(`api/order/deleteOrder/${editRow.id}`).then(()=>{
            $host.get('api/order/getAll').then(
                res=> { loading(res)}
        )})
        setIsFormAdd(false)
        dispach({type:"editRow", payload: 0})
    }

    const thema =()=>{
        if(editRow.id>0) return 'success'
        else return 'primary'
    }

    const CopyText =()=>{
        if(show===true){
            setTimeout(()=>{
                setShow(false)
            },1000)
            return 'готово!'
        }
    }

    useKeypress(['ArrowUp', 'ArrowDown'], (event) => {
        if (event.key === 'ArrowUp') {
            nextShow(+1)
        } else {
            nextShow(-1)
        }
        
      })

    const ChangeStatus = () =>{
        $host.put(`api/order/updateStatus/${editRow.id}`, {'status': status})
    }

    const [showDelete, setShowDelete] = useState(false)

    const copyCode = (codeOutside) =>{
        let text = ''
        
        if(typePost === 'E'){
            text = 
        `
        Здравствуйте. Заказ отправили. 
Сумма наложенного платежа: ${price}р (с учетом пересылки)
Код для отслеживания: ${codeOutside}
        `
        }

        if(typePost === 'R' && !firstClass){
            text = 
        `
        Здравствуйте. Заказ отправили. 
Сумма наложенного платежа: ${price}р
Код для отслеживания: ${codeOutside}
        `
        }

        if(typePost === 'R' && firstClass){
            text = 
        `
        Здравствуйте. Письмо отправили. Вот данные для оплаты:
 
4255 1901 5302 8421
12/23
 
сумма ${price}р за заказ +2р пересылка. Итого ${Number(price)+2}р
${codeOutside} - код для отслеживания
        `
        }
        

        return text
    }

    return(
        <>
        <Modal show={showDelete} onHide={()=>setShowDelete(false)}centered>
            <Row>
                <Col>
                    <Alert variant='danger' style={{textAlign:'center'}}>Уверены, что хотите удалить?</Alert>
                </Col>
            </Row>
            <Row className="m-2 justify-content-center">
                <Col md={6} style={{textAlign: 'center'}}>
                <Button  variant='danger' onClick={()=>DeleteBtn()}>да</Button>
                </Col>
                <Col style={{textAlign: 'center'}}>
                <Button  variant='secondary' md={6} onClick={()=>setShowDelete(false)}>нет</Button>
                </Col>
            </Row>

            
        </Modal>
        <Modal size='lg' show={isFormAdd} onHide={()=>ModalClose()} dialogClassName="modal-80w">
        
        <Modal.Body>
            {editRow.id>0?
            <Card style={{height: 37, backgroundColor:'SeaGreen', color:'white', fontFamily: 'Tahoma', textAlign:'center', fontSize: 21}}>Редактирование заказа</Card>:
            <Card style={{height: 37, backgroundColor:'RoyalBlue', color:'white',fontFamily: 'Tahoma', textAlign:'center', fontSize: 21}}>Добавление заказа</Card>
            
            }
            
            <Card className='mt-3'>
            <Row className='p-3'>
                <Col md={5}>
                    <Row className="mb-1">
                        <Col md={3}> <FormLabel>Имя:</FormLabel></Col>
                        <Col md={9}><FormControl size='sm' value={nikname} onChange={(e)=>setNikname(e.target.value)} /> </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md={3}> <FormLabel>ФИО</FormLabel></Col>
                        <Col md={9}><FormControl size='sm'  value={name} onChange={(e)=>setName(e.target.value)} /> </Col>
                    </Row>
                    <Row>
                        <Col md={3}> <FormLabel>Телефон:</FormLabel></Col>
                        <Col md={9}><FormControl size='sm' value={phone} onChange={(e)=>setPhone(e.target.value)} /> </Col>
                    </Row>
                    <Row>
                        <Col md={{span: 9, offset:3}}> 
                        <CopyToClipboard text={phone+ " "+name}>
                            <Button  onClick={() => setShow(true)} className='mt-2 button-copy' style={{width:"100%"}} variant='light' size='sm'>
                                {show?CopyText():'copy'}
                            </Button>
                        </CopyToClipboard>
                        </Col>
                        
                    </Row>
                    
                </Col>

                <Col md={{span:6, offset:1}}>
                    <Row>
                        <Col md={5} className="mb-1">
                            <FormSelect  size='sm' defaultValue={typePost} onChange={(e)=>setTypePost(e.target.value)}>
                                <option value={'E'}>Европочта</option>
                                <option value={'R'}>Белпочта</option>
                            </FormSelect>
                        </Col>
                        {typePost==="R"?<>
                        <Col md={{span:1, offset:2}} className="mb-1">
                            <FormCheck checked={firstClass} onChange={(e)=>setFirstClass(e.target.checked)} />
                        </Col>
                        <Col md={{span:4, offset:0}} className="mb-1">
                            <FormLabel style={{fontSize:15}}>первый класс</FormLabel>
                        </Col></>:null}
                    </Row>
                    {typePost==="E"?
                    <>
                    <Row className="mb-1">
                        <Col md={3}> <FormLabel>Город:</FormLabel></Col>
                        <Col md={9}><FormControl size='sm' value={city} onChange={(e)=>setCity(e.target.value)} /> </Col>
                    </Row>
                    <Row>
                        <Col md={3}> <FormLabel>Отделение:</FormLabel></Col>
                        <Col md={9}><FormControl size='sm' value={adress} onChange={(e)=>setAdress(e.target.value)} /> </Col>
                    </Row>
                    </>
                    :
                    <>
                    <Row className="mb-1">
                        <Col md={3}> <FormLabel>Город:</FormLabel></Col>
                        <Col md={9}><FormControl size='sm' value={city} onChange={(e)=>setCity(e.target.value)} /> </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md={3}> <FormLabel>Адрес:</FormLabel></Col>
                        <Col md={9}><FormControl size='sm' value={adress} onChange={(e)=>setAdress(e.target.value)} /> </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md={3}> <FormLabel>Индекс:</FormLabel></Col>
                        <Col md={9}><FormControl size='sm' value={postCode} onChange={(e)=>setPostCode(e.target.value)} /> </Col>
                    </Row>
                    <Row className="mb-1">
                        <Col md={3}> <FormLabel>Район:</FormLabel></Col>
                        <Col md={9}><FormControl size='sm' value={raion} onChange={(e)=>setRaion(e.target.value)} /> </Col>
                    </Row>
                    <Row>
                        <Col md={3}> <FormLabel>Область:</FormLabel></Col>
                        <Col md={9}><FormControl size='sm' value={oblast} onChange={(e)=>setOblast(e.target.value)} /> </Col>
                    </Row>
                    </>
                    }
                </Col>
            </Row>
            </Card>

            <FormatAll photo={photo} setPhoto={setPhoto} thema={thema} price={price} setPrice={setPrice} />
            
            <Card className='mt-3'>
                <Row className='p-3'>
                    <Col md={6}>
                        <Form.Label size='sm'>Примечания:</Form.Label>
                        <FormControl value={other} onChange={(e)=>setOther(e.target.value)} size='sm' as="textarea" rows={3} />
                    </Col>
                    <Col md={3}>
                        <Form.Label size='sm'>Внутренний код:</Form.Label>
                        <FormControl defaultValue={codeInside} size='sm' disabled />
                        <CopyToClipboard text={codeInside}>
                        <Button className='mt-2' style={{width:"100%"}} variant='light' size='sm'>copy</Button>
                        </CopyToClipboard>
                        
                    </Col>
                    <Col md={3}>
                        <Form.Label size='sm'>Почтовый код:</Form.Label>
                        <FormControl size='sm'   value={codeOutside} onChange={(e)=>setCodeOutside(e.target.value)} />
                        <CopyToClipboard text={copyCode(codeOutside) || " "}>
                            <Button className='mt-2' style={{width:"100%"}} size='sm' variant='light'>copy</Button>
                        </CopyToClipboard>
                    </Col>
                </Row>
            </Card>

            {editRow.id>0 ? 
            <Row className='mt-4'>
                <Col>
                    <Button variant ={thema()} onClick={()=>nextShow(+1)}><i className="bi bi-arrow-up"></i></Button>{" "}
                    <Button variant ={thema()} onClick={()=>nextShow(-1)}><i className="bi bi-arrow-down"></i></Button>{" "}
                </Col>
                <Col style={{textAlign: 'center'}}>
                    <FormSelect value={status} onChange={(e)=>setStatus(e.target.value)}>
                        <option value="1">принят</option>
                        <option value="2">обработан</option>
                        <option value="3">в печати</option>
                        <option value="4">упакован</option>
                        <option value="5">отправлен</option>
                        <option value="6">оплачен</option>
                    </FormSelect>
                </Col>
                <Col style={{textAlign: 'right'}}>
                    <Button variant ={thema()} onClick={()=>SendToDB()}>Сохранить</Button>{" "}
                    <Button variant="light" onClick={()=>setShowDelete(true)}>Удалить</Button>
                </Col>
            </Row> 
            :
            <Row className='mt-4'>
                <Col style={{textAlign: 'right'}}>
                    <Button variant ={thema()} onClick={()=>SendToDB()}>Сохранить</Button>{" "}
                </Col>
            </Row> }
            
            
        </Modal.Body>
        </Modal>     
         </>   
    )
}