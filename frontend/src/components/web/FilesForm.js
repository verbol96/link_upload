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
        setFormats([...formats.slice(0,index), {...formats[index], files: arr}, ...formats.slice(index+1)])

        arr.forEach(el=>{  
            const reader = new FileReader()
            reader.onload = (ev) =>{
                setFilesPrev((prev)=>{
                return [
                    ...prev,{
                    id: uuidv4(),
                    imageUrl: reader.result,
                    FilesInput
                    }
                ]
                })
            }
            reader.readAsDataURL(el)
        }) 
    }

    const deleteImg = (value) =>{
        setFilesPrev((prev)=>{
            return prev.filter(el=>el.id!==value)
        })
    }

    return(
        <Card className="p-3 mt-3" style={{backgroundColor: 'rgb(237, 237, 237)'}}>
            <Row>
                <Col md={2}>
                    <label className='upload_label' htmlFor={index}>загрузить файл</label>
                    <input className='upload_input' id={index} type="file" multiple={true}  onChange={(e)=>FilesInput(e)}></input>
                </Col>
                <Col md={2}>
                    <Stack direction="horizontal" gap={2}>
                        <FormLabel>Тип:</FormLabel>
                        <FormSelect size='sm' value={el.type} onChange={(e)=>ChangeType(e)}>
                            {TypePhoto.map((el,index)=><option key={index}>{el}</option>)}
                        </FormSelect>
                    </Stack>
                </Col>
                <Col md={3}>
                    <Stack direction="horizontal" gap={2}>
                        <FormLabel>Размер:</FormLabel>
                        <FormSelect size='sm' value={el.format} onChange={(e)=>ChangeSize(e)}>
                            {sizePhoto().map((el,index)=><option key={index}>{el}</option>)}
                        </FormSelect>
                    </Stack>
                </Col>
                {el.type==='фотографии'?
                <Col md={2}>
                    <Stack direction="horizontal" gap={2}>
                        <FormLabel>Бумага:</FormLabel>
                        <FormSelect size='sm' value={el.paper} onChange={(e)=>ChangePaper(e)}>
                            <option>Глянец</option>
                            <option>Люстра</option>
                        </FormSelect>
                    </Stack>
                </Col>
                :
                null
                }
                
                <Col md={{offset: el.type==='фотографии'? 2 : 4}}>
                    <Button size='sm' variant='light' onClick={()=>DeleteFormat(el)}>удалить</Button>
                </Col>
                
            </Row>
            <Row>
                <div  style={{display: 'flex', flexWrap: "wrap"}}>
                    {filesPrev.map((el)=> <ImgCard image={el} key={el.id} deleteImg={deleteImg} /> )}
                </div>
            </Row>
        </Card>
    )
}