import { useState, useEffect } from "react"
import { NavBar } from "../components/admin/NavBar"
import { getSettings, updateSettings } from "../http/dbApi"
import {Row, Col, Button, FormControl} from 'react-bootstrap'

const Setting = () =>{

    const [settings, setSettings] = useState([])
    const [editTitle, setEditTitle] = useState('')
    const [editValue, setEditValue] = useState('')

    useEffect(()=>{
        async function getPriceList (){
            let value = await getSettings()
            setSettings(value)
        }
        getPriceList()

    }, [])

    const BtnClick = async(title, value) =>{
        if(editTitle===''){
            setEditTitle(title)
            setEditValue(value)
        }else{
            await updateSettings(editTitle, editValue)
            let value =await getSettings()
            setSettings(value)
            
            setEditTitle('')
            setEditValue('')
        }
        
    }

    return (
        <div>
            <NavBar />
            <h3 style={{display:'flex', justifyContent:'center', margin: 30}}>Настройки</h3>
            
            {settings.map((el,index)=><Row key={index} className='mt-1 justify-content-center'>
                <Col md={1}>
                    <Button size="sm" variant="secondary" style={{width: '100%'}}> {el.title} </Button>
                </Col>
                <Col md={1}>
                    {(editTitle===el.title)?
                    <FormControl size="sm" value={editValue} onChange={(e)=>setEditValue(e.target.value)} />
                    :
                     <Button size="sm" variant="secondary" style={{width: '100%'}}> {el.value} </Button>
                    }
                </Col>
                <Col md={1}>
                    {(editTitle===el.title)?
                    <Button size="sm" variant="warning" style={{width: '100%'}} onClick={()=>BtnClick()}> сохранить </Button>
                    :
                    <Button size="sm" variant="light" style={{width: '100%'}} onClick={()=>BtnClick(el.title, el.value)}> изменить </Button>
                    }
                    </Col>
            </Row>)}
        </div>
    )
}

export default Setting

