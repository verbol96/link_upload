import { NavBarAdmin } from "../components/admin/NavBarAdmin"
import React, { useState, useEffect } from 'react';
import { $host } from '../http';

const Statistic = () => {
  const [orders, setOrders] = useState([]);
  const [type, setType] = useState('day');

  useEffect(() => {
    async function getOrder() {
      const { data } = await $host.get('api/order/getAllArchive');
      setOrders(data.orders);
    }
    getOrder();
  }, []);

  function generateMonthlySum(orders) {
    const groupedOrders = orders.reduce((acc, order) => {
        const date = new Date(order.createdAt);
        const formattedDate = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    
        if (!acc[formattedDate]) {
          acc[formattedDate] = { month: formattedDate, total: 0 };
        }
    
        const price = parseFloat(order.price).toFixed(2);
        acc[formattedDate].total += Number(price);
    
        return acc;
      }, {});
    
      return Object.values(groupedOrders).sort((a, b) => new Date(b.month) - new Date(a.month)).reverse();
  }

  function generateDailySum(orders) {
    const groupedOrders = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt);
      const formattedDate = date.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

      if (!acc[formattedDate]) {
        acc[formattedDate] = { day: formattedDate, total: 0 };
      }

      const price = parseFloat(order.price).toFixed(2);
      acc[formattedDate].total += Number(price);

      return acc;
    }, {});

    return Object.values(groupedOrders).sort((a, b) => new Date(b.day) - new Date(a.day)).reverse();
  }

  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return [d.getUTCFullYear(), weekNo];
  }

  function groupByWeek(orders) {
    const groups = orders.reduce((acc, order) => {
        const date = new Date(order.day);
        const week = getWeekNumber(date).join('-');

        if(!acc[week]) {
            acc[week] = [];
        }

        acc[week].push(order);
        return acc;
    }, {});

    return Object.values(groups);
  }

  function getDayOfWeek(date) {
    const dayOfWeek = new Date(date).getDay() || 7;
    return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][dayOfWeek - 1];
  }

  const ordersByMonth = generateMonthlySum(orders);
  const ordersByDay = generateDailySum(orders);
  const weeks = [1,2];

  

  return (
    <>
      <NavBarAdmin />

      <div>
        <div md={{ span: 2 }} style={{ marginLeft: '5%' }}>
          <select className='mt-3' value={type} onChange={(e) => setType(e.target.value)}>
            <option value='day'>day</option>
            <option value='month'>month</option>
          </select>
        </div>
      </div>

      {type === 'day' ? 
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {weeks.map((week, index) => (
            <div key={index} style={{display: 'flex'}}>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((dayOfWeek, index) => {
                const day = week.find(d => getDayOfWeek(d.day) === dayOfWeek);
                return (
                  <div key={index} style={{width: '14.2%', border: '1px solid black'}}>
                    {day ? (
                      <>
                        <div>{day.day}</div>
                        <div>{Math.floor(day.total).toLocaleString('ru-RU')} руб</div>
                      </>
                    ) : (
                      <div>{dayOfWeek}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
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
  );
};

export default Statistic