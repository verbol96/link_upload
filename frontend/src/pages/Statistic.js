import { NavBar } from "../componentsAdmin.js/NavBar"
import {Alert, FormSelect, Row, Col} from 'react-bootstrap'
import {useEffect, useState} from 'react'
import { getAll } from "../http/dbApi"
import _ from 'lodash'
import '../componentsTable/table.css'

const Statistic = () =>{
    
    const [order, setOrder] = useState([])
    const [days, setDays] = useState([])
    const [weeks, setWeeks] = useState([])
    const [monthes, setMonthes] = useState([])
    const [type, setType] = useState('day') //тип селекта для отображения

    useEffect(()=>{
        async function getOrder (){
            let  value = await getAll()
            setOrder(_.orderBy(_.orderBy(value, 'id', 'asc' ), 'status', 'asc' ))
        }
        getOrder()
        const startDay = new Date(2023,1,13)
        let dayN = (Date.now() - startDay)/1000/60/60/24

        const day = [] 
        let i = 0
        while(i<dayN){
            let copyStartDay = new Date(2023,1,13)
            day.push(new Date(copyStartDay.setDate(copyStartDay.getDate()+i)))
            i++
        }
        setDays(day)

        const month = []
        i = 0
        while(i<dayN/30+1){
            let copyStartDay = new Date(2023,1,1)
            month.push(new Date(copyStartDay.setMonth(copyStartDay.getMonth()+i)).toLocaleString("ru", {year: 'numeric',  month: 'numeric'}))
            i++
        }
       
        setMonthes(month)

        const week = []
        i = 0
        while(i<dayN/7){
            let copyStartDay = new Date(2023,1,13)
            week.push(new Date(copyStartDay.setDate(copyStartDay.getDate()+i*7)))
            i++
        }
       
        setWeeks(week)
    },[])

    const sum =(date)=>{ 
        let value
        switch(type){
            case 'day': {
                const [d,m,y] = date.split('.')
                value = `${y}-${m}-${d}`
                break
            }
            case 'month': {
                const [m,y] = date.split('.')
                value = `${y}-${m}`
                break
            }
            default:{}
        }
        
        return order.reduce((acc, el)=>{
            if(el.createdAt.includes(value)){
                return acc + Number(el.price)
            }
            return acc
        },0)
    }

    const sumWeek = (date) =>{

        let step;
        let value = []
        for (step = 0; step < 7; step++) {
            const dd = new Date(date)
            let [d,m,y] = new Date(dd.setDate(date.getDate()+step)).toLocaleString("ru", {year: 'numeric',  month: 'numeric',  day: 'numeric'}).split('.')
            value.push(`${y}-${m}-${d}`)
        }

        return order.reduce((acc, el)=>{
            if(value.some((elem)=>{
                return el.createdAt.includes(elem)
            })) return acc + Number(el.price)
            return acc
        },0)
    }

   

    return(
        <>
        <NavBar />

        <Row>
            <Col md={{span:2}} style={{marginLeft: '5%'}}>
                <FormSelect className="mt-3" value={type} onChange={(e)=>setType(e.target.value)}>
                    <option value='day'>day</option>
                    <option value='month'>month</option>
                </FormSelect>
            </Col>
        </Row>

        {type==='day'? 
        <Row className="justify-content-center mt-5">
            <Col md={10}>
                <div className="stat">
                {days.map((el,index)=><div key={index} className='cardStat'>
                    <div>
                        {sum(el.toLocaleString("ru", {year: 'numeric',  month: 'numeric',  day: 'numeric'})).toFixed(2)}
                    </div>
                    <div>
                        {el.toLocaleString("ru", {year: 'numeric',  month: 'numeric',  day: 'numeric',  weekday: 'long'})}
                    </div>
                </div>
                )}
                </div>
            </Col>
            <Col md={1}>
                <div className="stat">
                    {weeks.map((el,index)=><div key={index} className='cardWeek'>
                        <div>
                            {sumWeek(el).toFixed(2)}
                        </div>
                        <div>
                            This week
                        </div>
                        </div>)}
                </div>
            </Col>
        </Row>

        :

            <Row className="mt-5">
               {monthes.map((el, index)=><div key={index}>
                <Row className="justify-content-center">
                    <Col  md={3}>
                        <Alert variant="secondary" style={{textAlign: 'center'}}>{el}</Alert>
                    </Col>
                    <Col md={3}>
                        <Alert variant="info"  style={{textAlign: 'center'}}>{sum(el).toFixed(2)}р</Alert>
                    </Col>
                </Row>
                
                </div>)}
            </Row>
        }
        
        </>
    )
}

export default Statistic