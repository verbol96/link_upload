import {useDispatch, useSelector} from 'react-redux'
import {FormCheck, FormSelect} from 'react-bootstrap'
//import React, { useState } from 'react';
import {$host} from '../../http/index'

export const TableRow = ({el, user, setIsFormAdd, photo, adressOrder, path, isFormAdd, loading}) =>{

    const dispach = useDispatch()          

    const EditRow = () =>{
        if(editRow === 0){
            setIsFormAdd(true)
            dispach({type: "editRow", payload: el})
        }
    }

    const date = el.createdAt.split("T")[0].split("-")
    //console.log(el.createdAt)

    const ColorBG = [
        'white',// принят
        'Orchid',//готово к печати
        'Gold',// в печати
        'YellowGreen',// готово к отправке
        'LightSalmon',// отправлено
        'white'// оплачено
    ]

    const ChangeStatus = (event) =>{
        $host.put(`api/order/updateStatus/${el.id}`, {'status': event.target.value}).then(()=>{
            $host.get('api/order/getAll').then(
            res=> {loading(res) }
        )})
    }
    const newFormat = ['а6', 'а5', 'мини', 'пол', 'дд', 'а4', '<а4', '<а5', '<а6', '<а7', 'магнит']
    const PhotoShow=()=>{
        return photo.reduce((sum, el)=>{
            if(newFormat.includes(el.format)){
                if(el.paper==='lustre'){
                    return sum+el.amount+el.format+"ЛЮСТР "
                }else{
                    return sum+el.amount+el.format+" "
                }
            }else{
            if(el.paper==='lustre'){
                return sum+el.amount+"шт("+el.format+")ЛЮСТР "
            }else{
                return sum+el.amount+"шт("+el.format+") "
            }}
        }, '')
    }

    const Warning = () =>{
        let a = []
        if(el.codeOutside){
            a.push(<i className="bi bi-qr-code" style={{}}></i>)
         }
        if(adressOrder.firstClass === true){
           a.push( <i className="bi bi-1-square-fill pr-1" style={{color:'red'}}></i>)
        }
        if(el.other){
            a.push( <i className="bi bi-exclamation-square" style={{backgroundColor :'yellow'}}></i>)
         }
         
        return a.map((el, index)=><span key={index}>{el} </span>)
    }

    const CheckChange =(e)=>{
        if(e){
            dispach({type:'getPrintList', payload: user})
        }else{
            dispach({type:'setPrintList', payload: user})
        }
    }

    const editRow = useSelector(state=>state.order.editRow)
    const ActiveRow = () =>{
        if(el.id===editRow.id && isFormAdd) return 'green' // когда активна модалка, подсветка строки
        if(el.id===editRow.id) return 'PaleGreen' // 2сек после модалки, подсветка строки
    }
   
    return(
        <tr style={{fontSize:13, backgroundColor: ActiveRow() }}>
            <td style={{width: 25}}><FormCheck onChange={(e)=>CheckChange(e.target.checked)} /></td>
            <td style={{width: 45, textAlign:'center', fontFamily: "Geneva", fontSize:12}} onClick={()=>EditRow()}>{date[2]+"."+date[1]}</td>
            <td style={{width: 35, textAlign:'center', color: 'DarkSlateGrey', fontSize:12, fontFamily: "Arial Black"}} onClick={()=>EditRow()}>{adressOrder.typePost + (el.id%99+1)}</td>
            <td style={{width: 180, overflow:'hidden', whiteSpace: 'nowrap'}} onClick={()=>EditRow()}>{user.nikname}</td>
            <td style={{width: 140, textAlign:'center', fontFamily: "Geneva"}} onClick={()=>EditRow()}>{user.phone}</td>
            <td style={{width: 140, textAlign:'center'}} onClick={()=>EditRow()}>{adressOrder.city}</td>
            <td onClick={()=>EditRow()}>{PhotoShow()}</td>
            <td style={{width:56}} onClick={()=>EditRow()}>{Warning()}</td>
            <td style={{width: 110, textAlign:'right', fontFamily: "Geneva"}} onClick={()=>EditRow()}>{el.price}</td>
            <td style={{width: 110}}>
                <FormSelect style={{backgroundColor: ColorBG[el.status-1],  fontSize: 12, margin: -3, marginRight: 0}} size='sm' value={el.status} onChange={(e)=>ChangeStatus(e)}>
                    <option value="1">принят</option>
                    <option value="2">обработан</option>
                    <option value="3">в печати</option>
                    <option value="4">упакован</option>
                    <option value="5">отправлен</option>
                    <option value="6">оплачен</option>
                </FormSelect>
            </td>
        </tr>
    )
}