import {Row, Col} from 'react-bootstrap'
import { ImgCard } from './ImgCard'
import {useEffect, useState} from 'react'
import { v4 as uuidv4 } from 'uuid'
import './styleWeb.css'
import { useDispatch, useSelector } from 'react-redux'
import pica from 'pica';
import { saveSettings } from '../../store/orderReducer'
import { $host } from '../../http'

export const FilesForm = ({el, index, DeleteFormat, formats, setFormats}) =>{
    //console.log(el)

    const dispach = useDispatch()
    
    useEffect(()=>{
      $host.get('api/order/getAll').then(
          res=> {
              dispach(saveSettings(res.data.settings))
          }
      )  
    },[dispach])



    const settings = useSelector(state=>state.order.settings)
   
    const TypePhoto = ['photo', 'holst', 'magnit']
   
    const FormatPhoto = settings.filter(el=>el.type==='photo')
    const FormatHolst = settings.filter(el=>el.type==='holst')
    const FormatMagnit = settings.filter(el=>el.type==='magnit')

    
    const sizePhoto =()=>{
        switch(el.type){
            case 'photo': return FormatPhoto
            case 'holst': return FormatHolst
            case 'magnit': return FormatMagnit
            default: return FormatPhoto
        }
    }

    const ChangeType = (e)=>{
        let formatValue
        if(e.target.value==='photo') formatValue=FormatPhoto[0].title
        if(e.target.value==='holst') formatValue=FormatHolst[0].title
        if(e.target.value==='magnit') formatValue=FormatMagnit[0].title
        setFormats([...formats.slice(0,index), {...formats[index], type: e.target.value, format: formatValue}, ...formats.slice(index+1)])
    }

    const ChangeSize = (e) =>{
        setFormats([...formats.slice(0,index), {...formats[index], format: e.target.value}, ...formats.slice(index+1)])
    }

    const ChangePaper = (e) =>{
        setFormats([...formats.slice(0,index), {...formats[index], paper: e.target.value}, ...formats.slice(index+1)])
    }

    const [filesPrev, setFilesPrev] = useState([])

    const FilesInput = (e) => {
        const arr = Array.from(e.target.files);
        setFormats([
          ...formats.slice(0, index),
          { ...formats[index], files: formats[index].files.concat(arr) },
          ...formats.slice(index + 1),
        ]);
      
        const compressImage = async (file, maxWidth = 800, maxHeight = 800) => {
          const img = new Image();
          img.src = URL.createObjectURL(file);
      
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const picaInstance = pica();
      
          return new Promise((resolve, reject) => {
            img.onload = async () => {
              const scaleFactor = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
              canvas.width = img.width * scaleFactor;
              canvas.height = img.height * scaleFactor;
      
              await picaInstance.resize(img, canvas, {
                unsharpAmount: 80,
                unsharpRadius: 0.6,
                unsharpThreshold: 2,
              });
      
              ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(resolve, file.type, 0.8);
            };
      
            img.onerror = (error) => {
              reject(error);
            };
          });
        };
      
        const readAsDataURL = async (file) => {
          const compressedBlob = await compressImage(file);
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
      
            reader.onload = (ev) => {
              resolve({
                id: uuidv4(),
                imageUrl: reader.result,
                name: file.name,
                FilesInput,
              });
            };
      
            reader.onerror = (error) => {
              reject(error);
            };
      
            reader.readAsDataURL(compressedBlob);
          });
        };
      
        const loadPreviews = async (files) => {
          for (const file of files) {
            try {
              const preview = await readAsDataURL(file);
              setFilesPrev((prev) => [...prev, preview]);
            } catch (error) {
              console.error('Ошибка чтения файла:', error);
            }
          }
        };
      
        loadPreviews(arr);
      };


    const deleteImg = (image) =>{
        setFormats([...formats.slice(0,index), {...formats[index], files: formats[index].files.filter(el=>el.name!==image.name)}, ...formats.slice(index+1)])
        setFilesPrev((prev)=>{
            return prev.filter(el=>el.id!==image.id)
        })
    }


    return(
        <div className="filesFormFormat">
            <Row>
                <Col md={2}>
                    <div className="containerSelect">
                        <label className="labelSelect">Тип:</label>
                        <select className="selectForm" value={el.type} onChange={(e)=>ChangeType(e)}>
                            {TypePhoto.map((el,index)=><option key={index}>{el}</option>)}
                        </select>
                        <span className="selectArrow">▼</span>
                    </div>
                    <div className="containerSelect mt-4">
                        <label className="labelSelect">Размер:</label>
                        <select className="selectForm"  value={el.format} onChange={(e)=>ChangeSize(e)}>
                            {sizePhoto().map((el,index)=><option key={index}>{el.title}</option>)}
                        </select>
                        <span className="selectArrow">▼</span>
                    </div>
                    {el.type==='photo'
                    ?
                    <div className="containerSelect mt-4">
                    <label className="labelSelect">Бумага:</label>
                    <select className="selectForm"  value={el.paper} onChange={(e)=>ChangePaper(e)}>
                        <option value='glossy'>glossy</option>
                        <option value='lustre'>lustre</option>
                    </select>
                    <span className="selectArrow">▼</span>
                    </div>
                    :
                    null
                    }
                    
                </Col>
                <Col md={10}>
                    <div  style={{display: 'flex', flexWrap: "wrap"}}>
                        
                        <div className="cardFile" style={{border: '2.5px #0E3C47 dashed'}}>
                            <label className='upload_label' htmlFor={index}>
                                <div style={{fontSize: 30, textAlign: 'center'}}><i className="bi bi-plus" ></i></div>
                                <div style={{textAlign: 'center', padding: 5}}>добавить фото</div>
                            </label>
                            <input className='upload_input' id={index} type="file" multiple={true} onChange={(e)=>FilesInput(e)}></input>
                        </div>

                        {filesPrev.map((el)=> <ImgCard image={el} key={el.id} deleteImg={deleteImg} /> )}
                    </div>
                </Col>
            </Row>
            
            <Row>
                <Col md={2}>
                    <button className="buttonForm buttonForm2" onClick={()=>DeleteFormat(el)}>удалить формат</button>
                </Col>
                <Col className='mt-3'><h5 className='textH5'>Добавлено {formats[index].files.length} фото {el.format}</h5></Col>
            </Row>
        </div>
    )
}