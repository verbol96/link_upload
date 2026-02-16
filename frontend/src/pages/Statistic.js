import {FormSelect, Row, Col} from 'react-bootstrap'
import {useEffect, useState} from 'react'
import './stylePages.css'
import { $host } from "../http"
import { NavBar } from "../components/admin/NavBar"
import { ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent, } from "../ui/chart"
  import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart } from 'recharts';

const Statistic = () =>{
    
    const [order, setOrder] = useState([])
    const [days, setDays] = useState([])
    const [weeks, setWeeks] = useState([])
    const [type, setType] = useState('month') //тип селекта для отображения

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


    const monthNames = [
        "январь", "февраль", "март", "апрель", "май", "июнь", 
        "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"
      ];
      
      
      // Преобразуем объект обратно в массив и сортируем по дате
    const monthlySum = order.reduce((acc, curr) => {
        const month = new Date(curr.createdAt).toLocaleString('ru-RU', { month: 'long', year: '2-digit' });
        const monthOnly = new Date(curr.createdAt).toLocaleString('ru-RU', { month: 'long' }); // "февраль"
        const monthNumber = new Date(curr.createdAt).getMonth() + 1; // 2 (январь = 0, поэтому +1)
        const year = new Date(curr.createdAt).getFullYear().toString().slice(-2); // "23"

        
        const price = parseFloat(curr.price);  // Преобразуем цену в число
      
        // Пропускаем, если значение цены не является числом
        if (isNaN(price)) {
          return acc;
        }
      
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.total = parseFloat((existing.total + price).toFixed(2));
        } else {
          acc.push({ month, monthOnly, monthNumber, year,  total: parseFloat(price.toFixed(2))  });  // Добавляем новый месяц
        }
        return acc;
      }, []).sort((a, b) => {
        // Сравниваем годы
        if (a.year !== b.year) {
          return parseInt(a.year) - parseInt(b.year); // "22" < "23" < "24"
        }
        // Если годы равны, сравниваем месяцы
        return a.monthNumber - b.monthNumber; // 1 < 2 < 3 ... < 12
      });  // Сортируем по дате


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
            const formattedDate1 = date.toLocaleString('ru-RU', {year: 'numeric', month: 'numeric' });
            const formattedDate = formattedDate1.split('.')[1] +'.'+ formattedDate1.split('.')[0]
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
        <NavBar />

        <Row>
            <Col md={{span:2}} style={{marginLeft: '5%', maxWidth: '90%'}}>
                <FormSelect className="mt-3" value={type} onChange={(e)=>setType(e.target.value)}>
                    <option value='day'>day</option>
                    <option value='month'>month</option>
                    <option value='graphic'>graphic</option>
                </FormSelect>
            </Col>
        </Row>

        {type==='day'&&
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
        }
        
        {type==='month'&& 
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
                          minWidth: '300px',
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

        {
          type==='graphic' && 
            <div className="flex flex-col gap-5 m-10">
           
              <ResponsiveContainer height={400}>
                <LineChart
                  data={monthlySum}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="10 5" /> //10px линия, 1px пробел (пунктирная сетка)
                  <XAxis 
                    dataKey="month" // например "2023-02"
                    tickFormatter={(dateKey) => {
                      // dateKey = "2023-02"
                      const [month, year] = dateKey.split(' ');
                      return `${month.slice(0,3)} ${year.slice(-2)}`;
                    }}
                      interval={2}
                  />
                  <YAxis tickCount={8} />
                  <Tooltip />
                  <Legend />
                 
                  <Line type="monotone" dataKey="total" stroke="#82ca9d" name="Доход по месяцам"  />
                </LineChart>
              </ResponsiveContainer>
            </div>

        }
        
        </>
    )
}

export default Statistic