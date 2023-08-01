import './DescRow.css';
import React from 'react';
import { useSelector } from 'react-redux'

export const OneFormat = ({el, setPhoto, photo, index, DeleteFormat}) =>{

  const settings = useSelector(state=>state.order.settings)
  const typePhoto = ['фото', 'холст', 'магнит']

  const formatPhoto = settings.filter(el=>el.type==='фото')
  const formatHolst = settings.filter(el=>el.type==='холст')
  const formatMagnit = settings.filter(el=>el.type==='магнит')

  const Update = (e, prop) =>{
    if(prop==='type'){
        switch(e.target.value){
            case 'фото': return setPhoto([...photo.slice(0, index), {type: "фото", format: "А6", amount: "1",  paper: 'глянец'}, ...photo.slice(index + 1)])
            case 'холст': return setPhoto([...photo.slice(0, index), {type: "холст", format: "30x40", amount: "1",  paper: 'глянец'}, ...photo.slice(index + 1)])
            case 'магнит': return setPhoto([...photo.slice(0, index), {type: "магнит", format: "5x8", amount: "1",  paper: 'глянец'}, ...photo.slice(index + 1)])
            default: return setPhoto([...photo.slice(0, index), {type: "фото", format: "А6", amount: "1",  paper: 'glossy'}, ...photo.slice(index + 1)])
        }
    }
    setPhoto([...photo.slice(0, index), {...photo[index], [prop]: e.target.value}, ...photo.slice(index + 1)])
}
  
  return(
      <div className='format_group'>
            <input type="text" value={el.amount} onChange={(e)=>Update(e, 'amount')}/>

            <select value={el.type} onChange={(e)=>Update(e, 'type')}>
              {typePhoto.map((el, index)=>
                <option key={index}>{el}</option>
              )}
            </select>

            <select value={el.format} onChange={(e)=>Update(e, 'format')}>
              {(el.type==='фото')?
                  formatPhoto.map((el,index)=><option key={index} value={el.title}>{el.title}</option>) :
                  (el.type==='холст')?
                  formatHolst.map((el,index)=><option key={index} value={el.title}>{el.title}</option>) :
                      (el.type==='магнит') ?
                      formatMagnit.map((el,index)=><option key={index} value={el.title}>{el.title}</option>) :
                          null
              }
            </select>
            <select value={el.paper} onChange={(e)=>Update(e, 'paper')}>
              <option value="люстр">люстр</option>
              <option value="глянец">глянец</option>
            </select>
            <button type="button" onClick={()=>DeleteFormat(index)}>удалить</button>
      </div>
  )
}


