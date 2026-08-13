import './DescRow.css';
import React, { useState } from 'react';
import { useSelector } from 'react-redux'

export const OneFormat = ({el, setPhoto, photo, index, DeleteFormat}) =>{

  const settings = useSelector(state=>state.order.settings)
  const typePhoto = ['photo', 'holst', 'magnit']
 
  const formatPhoto = settings.filter(el=>el.type==='photo')
  const formatHolst = settings.filter(el=>el.type==='holst')
  const formatMagnit = settings.filter(el=>el.type==='magnit')
  
  const Update = (e, prop) =>{
    if(prop==='type'){
        switch(e.target.value){
            case 'photo': return setPhoto([...photo.slice(0, index), {type: "photo", format: "а6", amount: "1", copies: 1,  paper: 'glossy'}, ...photo.slice(index + 1)])
            case 'holst': return setPhoto([...photo.slice(0, index), {type: "holst", format: "30x40", amount: "1", copies: 1,  paper: 'glossy'}, ...photo.slice(index + 1)])
            case 'magnit': return setPhoto([...photo.slice(0, index), {type: "magnit", format: "5x8", amount: "1", copies: 1,  paper: 'glossy'}, ...photo.slice(index + 1)])
            default: return setPhoto([...photo.slice(0, index), {type: "photo", format: "А6", amount: "1", copies: 1,  paper: 'glossy'}, ...photo.slice(index + 1)])
        }
    }
    setPhoto([...photo.slice(0, index), {...photo[index], [prop]: e.target.value}, ...photo.slice(index + 1)])
    
  }

    const getFiles = async () => {
      try {
          const data = await getFilesPhotosId(el.id); // получаем список файлов с метаданными
          
          // Считаем сколько файлов с размером > 0
          const ImgDownload = data.filter(item => item.size > 0).length;

          return ImgDownload;
      } catch (error) {
          console.error(error);
      }
    };

  const [check, setCheck] = useState('1')

  const CheckNow = async() =>{
      setCheck('2')
      const res = await getFiles()
      setCheck(res)
  }

  const showFlag = (check) =>{
    switch(check){
      case '1': return <i className="bi bi-search"></i>  
      case '2': return <i className="bi bi-arrow-repeat animate-spin"></i>
      default: return check
    }
  }
  
  return(
      <div className='format_group'>
            <button style={{background:'#f2f2f2', flex: 1, padding: '0px 5px', textAlign: 'center', width: 0, height: '30px', margin: '5px', color: 'lightgray'}}
               title="Проверить фото" onClick={()=>CheckNow()}> {showFlag(check)} </button>
            <input type="text" value={el.amount} onChange={(e)=>Update(e, 'amount')}/>

            <select value={el.type} onChange={(e)=>Update(e, 'type')}>
              {typePhoto.map((el, index)=>
                <option key={index}>{el}</option>
              )}
            </select>

            <select value={el.format} onChange={(e)=>Update(e, 'format')}>
              {(el.type==='photo')?
                  formatPhoto.map((el,index)=><option key={index} value={el.title}>{el.title}</option>) :
                  (el.type==='holst')?
                  formatHolst.map((el,index)=><option key={index} value={el.title}>{el.title}</option>) :
                      (el.type==='magnit') ?
                      formatMagnit.map((el,index)=><option key={index} value={el.title}>{el.title}</option>) :
                          null
              }
            </select>
            <input value={el.copies}  onChange={(e)=>Update(e, 'copies')}/>
            <select value={el.paper} onChange={(e)=>Update(e, 'paper')}>
              <option value="lustre">люстр</option>
              <option value="glossy">глянец</option>
            </select>
            <button type="button" onClick={()=>DeleteFormat(index)}>удалить</button>
      </div>
  )
}


