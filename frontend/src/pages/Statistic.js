import { NavBarAdmin } from "../components/admin/NavBarAdmin"
import {FormSelect, Row, Col} from 'react-bootstrap'
import {useEffect, useState} from 'react'
import './stylePages.css'
import { $host } from "../http"

const Statistic = () =>{
    
    const [order, setOrder] = useState([])
    const [days, setDays] = useState([])
    const [weeks, setWeeks] = useState([])
    const [type, setType] = useState('day') //тип селекта для отображения



    useEffect(()=>{

        async function getOrder() {
            const { data } = await $host.get('api/order/getAllStat');
            setOrder(data.orders);
            
          }
          getOrder();
        const startDay = new Date(2023,0,2)
        let dayN = (Date.now() - startDay)/1000/60/60/24

        const day = [] 
        let i = 0
        while(i<dayN){
            let copyStartDay = new Date(2023,0,2)
            day.push(new Date(copyStartDay.setDate(copyStartDay.getDate()+i)))
            i++
        }
        setDays(day)


        const week = []
        i = 0
        while(i<dayN/7){
            let copyStartDay = new Date(2023,0,2)
            week.push(new Date(copyStartDay.setDate(copyStartDay.getDate()+i*7)))
            i++
        }
       
        setWeeks(week)
        console.log()
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


    function generateMonthlySum(orders) {
        
        const groupedOrders = orders.reduce((acc, order) => {
            
            const date = new Date(order.createdAt);
            const formattedDate = date.toLocaleString('ru-RU', { month: 'numeric', year: 'numeric' });
        
            if (!acc[formattedDate]) {
              acc[formattedDate] = { month: formattedDate, total: 0 };
            }
        
            const price = parseFloat(order.price).toFixed(2);
            acc[formattedDate].total += Number(price);
        
            return acc;
          }, {});
        
          return Object.values(groupedOrders).sort((a, b) => (b.month) - (a.month));
      }
      const ordersByMonth = order ? generateMonthlySum(order) : [];
   

    return(
        <>
        <NavBarAdmin />

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

        <div>
            {
                ordersByMonth.map(el => (
                    <div 
                      key={el.month} 
                      style={{
                        display: 'flex', 
                        justifyContent: 'flex-start', 
                        alignItems: 'center', 
                        width: '30%', 
                        margin: '10px auto', 
                        border: '1px solid black', 
                        borderRadius: '5px', 
                        padding: '10px', 
                        backgroundColor: '#f0f0f0'
                      }}>
                      <div 
                        style={{
                          flex: 1, 
                          marginLeft: '10%', 
                          textAlign: 'left'
                        }}>
                        {el.month.replace('г.', '')}
                      </div>
                      <div 
                        style={{
                          flex: 1, 
                          marginLeft: '10%', 
                          fontWeight: 'Bolder', 
                          textAlign: 'left'
                        }}>
                        {Math.floor(el.total).toLocaleString('ru-RU')} руб
                      </div>
                    </div>
                  ))
            }
        </div>
      
        }
        
        </>
    )
}

export default Statistic