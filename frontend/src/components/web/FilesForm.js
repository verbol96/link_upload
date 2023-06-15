import {Card, Row, Button, Col, FormSelect, FormLabel, Stack} from 'react-bootstrap'
import { ImgCard } from './ImgCard'
import {useState} from 'react'
import { v4 as uuidv4 } from 'uuid'
import './style.css'
import { useSelector } from 'react-redux'

export const FilesForm = ({el, index, DeleteFormat, formats, setFormats}) =>{
    //console.log(el)
    const TypePhoto = ['фотографии', 'холсты', 'магниты']
    const FormatPhoto = useSelector(state=>state.files.FormatPhoto)
    const FormatHolst = useSelector(state=>state.files.FormatHolst)
    const FormatMagnit = useSelector(state=>state.files.FormatMagnit)

    const sizePhoto =()=>{
        switch(el.type){
            case 'фотографии': return FormatPhoto
            case 'холсты': return FormatHolst
            case 'магниты': return FormatMagnit
            default: return FormatPhoto
        }
    }

    const ChangeType = (e)=>{
        let formatValue
        if(e.target.value==='фотографии') formatValue=FormatPhoto[0]
        if(e.target.value==='холсты') formatValue=FormatHolst[0]
        if(e.target.value==='магниты') formatValue=FormatMagnit[0]
        setFormats([...formats.slice(0,index), {...formats[index], type: e.target.value, format: formatValue}, ...formats.slice(index+1)])
    }

    const ChangeSize = (e) =>{
        setFormats([...formats.slice(0,index), {...formats[index], format: e.target.value}, ...formats.slice(index+1)])
    }

    const ChangePaper = (e) =>{
        setFormats([...formats.slice(0,index), {...formats[index], paper: e.target.value}, ...formats.slice(index+1)])
    }

    const [filesPrev, setFilesPrev] = useState([])

    const FilesInput = (e) =>{
        const arr = Array.from(e.target.files)
        setFormats([...formats.slice(0,index), {...formats[index], files: formats[index].files.concat(arr)}, ...formats.slice(index+1)])

        const readAsDataURL = (file) => {
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
              
              reader.readAsDataURL(file);
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
    }


    const deleteImg = (image) =>{
        setFormats([...formats.slice(0,index), {...formats[index], files: formats[index].files.filter(el=>el.name!==image.name)}, ...formats.slice(index+1)])
        setFilesPrev((prev)=>{
            return prev.filter(el=>el.id!==image.id)
        })
    }


    return(
        <Card className="p-3 mt-3" style={{border: "0.5px #705CF6 solid", backgroundColor:'inherit', boxShadow: '0px 5px 42px 3px rgba(57, 88, 112, 0.2)'}}>
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
                            {sizePhoto().map((el,index)=><option key={index}>{el}</option>)}
                        </select>
                        <span className="selectArrow">▼</span>
                    </div>
                    {el.type==='фотографии'
                    ?
                    <div className="containerSelect mt-4">
                    <label className="labelSelect">Бумага:</label>
                    <select className="selectForm"  value={el.paper} onChange={(e)=>ChangePaper(e)}>
                        <option>Глянец</option>
                        <option>Люстра</option>
                    </select>
                    <span className="selectArrow">▼</span>
                    </div>
                    :
                    null
                    }
                    
                </Col>
                <Col md={10}>
                    <div  style={{display: 'flex', flexWrap: "wrap"}}>
                        
                        <Card className="cardFile" style={{border: '2.5px #2c1e87 dashed', color: '#2c1e87'}}>
                            <label className='upload_label' htmlFor={index}>
                                <div style={{fontSize: 30, textAlign: 'center'}}><i className="bi bi-plus" ></i></div>
                                <div style={{textAlign: 'center'}}>добавить фото</div>
                            </label>
                            <input className='upload_input' id={index} type="file" multiple={true} onChange={(e)=>FilesInput(e)}></input>
                        </Card>

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
        </Card>
    )
}