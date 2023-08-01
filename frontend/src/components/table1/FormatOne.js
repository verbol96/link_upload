//import {useState} from 'react'
import {Col, InputGroup, FormSelect, FormControl, Button} from 'react-bootstrap'

export const FormatOne = ({index, el, thema, DeleteFormat, photo, setPhoto}) =>{


    const Update = (e, prop) =>{
        
        if(prop==='type'){
            switch(e.target.value){
                case 'photo': return setPhoto([...photo.slice(0, index), {type: "photo", format: "А6", amount: "1",  paper: 'glossy'}, ...photo.slice(index + 1)])
                case 'holst': return setPhoto([...photo.slice(0, index), {type: "holst", format: "30x40", amount: "1",  paper: 'glossy'}, ...photo.slice(index + 1)])
                case 'magnit': return setPhoto([...photo.slice(0, index), {type: "magnit", format: "магнит", amount: "1",  paper: 'glossy'}, ...photo.slice(index + 1)])
                default: return setPhoto([...photo.slice(0, index), {type: "photo", format: "А6", amount: "1",  paper: 'glossy'}, ...photo.slice(index + 1)])
            }
        }
        
        setPhoto([...photo.slice(0, index), {...photo[index], [prop]: e.target.value}, ...photo.slice(index + 1)])
    }

    const TypePhoto = [
        {value: "photo", title: 'photo'},
        {value: "holst", title: 'holst'},
        {value: "magnit", title: 'magnit'}
    ]

    const FormatPhoto = [
        {value: "а6", title: 'а6'},
        {value: "дд", title: 'дд'},
        {value: "пол", title: 'пол'},
        {value: "мини", title: 'мини'},
        {value: "а5", title: 'а5'},
        {value: "а4", title: 'а4'},
        {value: "<а7", title: '<а7'},
        {value: "<а6", title: '<а6'},
        {value: "<а5", title: '<а5'},
        {value: "<а4", title: '<а4'}

    ]
    const FormatHolst = [
        {value: "30x40", title: '30x40'},
        {value: "40x40", title: '40x40'},
        {value: "40x55", title: '40x55'},
        {value: "55x55", title: '55x55'},
        {value: "50x70", title: '50x70'},
        {value: "55x80", title: '55x80'}
    ]
    const FormatMagnit = [
        {value: "магнит", title: 'магнит'}
    ]

    return(
        <Col md={4} className="mb-3">
                     <InputGroup size='sm'>
                         <FormSelect style={{width:"40%"}} value={el.type} onChange={(e)=>Update(e, 'type')} >
                             {TypePhoto.map((el,index)=><option key={index} value={el.value}>{el.title}</option>)} 
                         </FormSelect>
                         <FormSelect style={{width:"60%"}} value={el.format} onChange={(e)=>Update(e, 'format')}  >
                             {(el.type==='photo')?
                                 FormatPhoto.map((el,index)=><option key={index} value={el.value}>{el.title}</option>) :
                                 (el.type==='holst')?
                                    FormatHolst.map((el,index)=><option key={index} value={el.value}>{el.title}</option>) :
                                      (el.type==='magnit') ?
                                         FormatMagnit.map((el,index)=><option key={index} value={el.value}>{el.title}</option>) :
                                         null
                             }
                         </FormSelect>
                         
                     </InputGroup>
                     <InputGroup size='sm'>
                         <FormControl  style={{width:"40%"}}  value={el.amount} onChange={(e)=>Update(e, 'amount')} />
                         <FormSelect style={{width:"40%"}}  value={el.paper} onChange={(e)=>Update(e, 'paper')}>
                             <option value={'glossy'}>glossy</option>
                             <option value={'lustre'}>lustre</option>
                         </FormSelect>
                         <Button variant ={thema()} style={{width:"20%"}} onClick={()=>DeleteFormat(index)}>X</Button>
                     </InputGroup>
                 </Col>
    )
}