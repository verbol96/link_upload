import {Row, Card,  Button, Col, FormControl, FormLabel} from 'react-bootstrap'
import {useEffect, useState} from 'react'
import { FormatOne } from './FormatOne'
import { getSettings } from "../../http/dbApi"

export const FormatAll = ({photo, setPhoto, thema, price, setPrice}) =>{

    const [settings, setSettings] = useState([])

    useEffect(()=>{
        async function getPriceList (){
            let value = await getSettings()
            setSettings(value)
        }
        getPriceList()

    }, [])


    const PriceList = (format) =>{
        let price = 0

        settings.forEach(el=>{
            if(el.title === format) {
                price = el.value
            }
        })

        return price
    }
    //console.log(photo)
    const Sum = () =>{
        const pr = photo.reduce((sum, el)=>{
            return sum+PriceList(el.format)*el.amount
        },0 )

        return pr.toFixed(2)
    }

    const AddFormat = () =>{
        const data = {
            type: "photo",
            format: "а6",
            amount: "1",
            paper: 'glossy'
        }
        setPhoto([...photo, data])
    }

    const DeleteFormat = (index) =>{
        setPhoto([...photo.slice(0, index), ...photo.slice(index + 1)])
    }

    return(
        <Card className='mt-3'>
            <Row className='p-3'>
                {photo.map((el, index)=>
                    <FormatOne key={index} index={index} el={el} thema={thema} DeleteFormat={DeleteFormat} photo={photo} setPhoto={setPhoto} />
                    )
                }
                </Row>
                <Row>
                    <Col md={3}>
                    <Button className='m-3 mt-0' variant ='light' style={{width:"100%"}} onClick={()=>AddFormat()}>+</Button>
                    </Col>
                    <Col className='mt-1 p-1' md={{span: 1, offset: 2}}>
                        <FormLabel>Рассчет:</FormLabel>
                    </Col>
                    <Col md={1}>
                        <Button variant ='light' onClick={()=>setPrice(Sum())}>{Sum()}</Button>
                    </Col>
                    <Col className='mt-1' md={{span: 1, offset: 1}}>
                        <FormLabel>Цена:</FormLabel>
                    </Col>
                    <Col md={2}>
                        <FormControl value={price} onChange={(e)=>setPrice(e.target.value)} />
                    </Col>
                    
                </Row>
                
            </Card>
    )
}