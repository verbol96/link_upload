import { useEffect, useState, useRef } from "react";
import Footer from "../components/admin/Footer";
import { NavBar } from '../components/admin/NavBar';
import Papa from 'papaparse';
import { Button } from "../ui/button";
import { ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent, } from "../ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart } from 'recharts';
import { Input } from "../ui/input";

const initialTeams = [
  // Топ 30 клубов
  { name: "Manchester City", rating: 100 },
  { name: "Liverpool", rating: 92 },
  { name: "Paris Saint-Germain", rating: 90 },
  { name: "Bayern Munich", rating: 89 },
  { name: "Real Madrid", rating: 88 },
  { name: "Barcelona", rating: 88 },
  { name: "Manchester United", rating: 85 },
  { name: "Chelsea", rating: 85 },
  { name: "Atletico Madrid", rating: 84 },
  { name: "Juventus", rating: 83 },
  { name: "Inter Milan", rating: 83 },
  { name: "AC Milan", rating: 82 },
  { name: "Tottenham Hotspur", rating: 81 },
  { name: "Napoli", rating: 80 },
  { name: "Borussia Dortmund", rating: 79 },
  { name: "RB Leipzig", rating: 78 },
  { name: "Sevilla", rating: 77 },
  { name: "Arsenal", rating: 76 },
  { name: "Roma", rating: 75 },
  { name: "Lazio", rating: 74 },
  { name: "Leicester City", rating: 73 },
  { name: "Real Sociedad", rating: 72 },
  { name: "Villarreal", rating: 71 },
  { name: "Ajax", rating: 70 },
  { name: "Porto", rating: 69 },
  { name: "Benfica", rating: 68 },
  { name: "Bayer Leverkusen", rating: 67 },
  { name: "Wolfsburg", rating: 66 },
  { name: "Atalanta", rating: 65 },
  { name: "Marseille", rating: 64 },

  // Топ 15 сборных
  { name: "Brazil", rating: 95 },
  { name: "France", rating: 94 },
  { name: "Argentina", rating: 93 },
  { name: "Germany", rating: 92 },
  { name: "Belgium", rating: 91 },
  { name: "Spain", rating: 90 },
  { name: "Portugal", rating: 89 },
  { name: "England", rating: 88 },
  { name: "Netherlands", rating: 87 },
  { name: "Italy", rating: 86 },
  { name: "Uruguay", rating: 85 },
  { name: "Croatia", rating: 84 },
  { name: "Denmark", rating: 83 },
  { name: "Mexico", rating: 82 },
  { name: "United States", rating: 81 },
];
 
const Test = () => {

  const player1 = 'Витя'
  const player2 = 'Денис'


  const [teams, setTeams] = useState(initialTeams);
  const [history, setHistory] =useState([])

  const [isGame, setIsGame] = useState(false)
  const [input1, setInput1] = useState(0)
  const [input2, setInput2] = useState(0)

  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')

  const getRandomTeam = () => {
    if (teams.length === 0) return null; // Проверка на случай, если команды закончились
    const randomIndex = Math.floor(Math.random() * teams.length);
    const selectedTeam = teams[randomIndex];
    return { selectedTeam, randomIndex }; // Возвращаем команду и индекс
  };
  
  const playGame = () => {
    setIsGame(true);

    const team1 = getRandomTeam();
    const team2 = getRandomTeam();
  
    while (team1.randomIndex === team2.randomIndex) {
      team2 = getRandomTeam();
    }

    const updatedTeams = teams.filter((_, index) => index !== team1.randomIndex && index !== team2.randomIndex);
    setTeams(updatedTeams);
  
    setTeam1(team1.selectedTeam)
    setTeam2(team2.selectedTeam)
  };

  const totalPoint = (id) => {
    // Получаем рейтинги команд
    const rating1 = team1.rating;
    const rating2 = team2.rating;
  
    let cof;
    if (id === 1) {
      cof = (rating2 / rating1); // Округляем до 2 знаков
    } else {
      cof = (rating1 / rating2); // Округляем до 2 знаков
    }

    // Проверяем, выиграла ли команда
    if ((id === 1 && input1 > input2) || (id === 2 && input2 > input1)) {
      return 3*cof; // Если команда выиграла, возвращаем 3 очка
    }
    if (input1 === input2) return 1*cof;
    return 0; // Если команда проиграла или ничья, возвращаем 0
  };

  const endGame = () =>{
    setIsGame(false)
    setInput1(0)
    setInput2(0)

    setHistory(prev=>[...prev,{
      id: history.length+1,
      player1: team1.name,
      player2: team2.name,
      score1: input1,
      score2: input2,
      point1: totalPoint(1),
      point2: totalPoint(2)
    }])
  }

  const total = (id) => {
    const sum = history.reduce((acc, el) => {
      // Преобразуем значения в числа перед суммированием
      const score = id === 1 ? Number(el.score1) : Number(el.score2);
      return acc + score; // Суммируем
    }, 0);
    
    return sum; // Возвращаем итоговую сумму
  };

  const sumPoint = (id) => {

    return history.reduce((acc, match) => {
      // Если id равно 1, добавляем score1, если 2 - добавляем score2
      return acc + (id === 1 ? (Number(match.point1)) : (Number(match.point2)));
    }, 0);
  };

  
console.log(history)
    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            {/*<NavBar />*/}
            <div className="flex flex-col gap-5 m-10">
              <div className="w-full text-4xl text-center text-green-950 font-bold">
                Турнир по FIFA 22
              </div>
              {isGame ?
                <div className="border rounded-lg p-4">
                  <div className="flex flex-row justify-around">
                    <div className="flex flex-col justify-center items-center">
                      <div>{team1.name}</div>
                      <div>
                        <Input value={input1} onChange={(e)=>setInput1(e.target.value)} className='w-[50px]' />
                      </div>
                    </div>

                    <div className="flex flex-col justify-center items-center">
                      <div>{team2.name}</div>
                      <div>
                        <Input value={input2} onChange={(e)=>setInput2(e.target.value)} className='w-[50px]' />
                      </div>
                    </div>
                  </div>
                  <div className="w-full flex justify-center mt-5">
                    <Button className='m-auto' onClick={() => endGame()}>конец матча</Button>
                  </div>
                </div>
                :
                <div>
                  <Button onClick={()=>playGame()}>играть матч!</Button>
                </div>
              }

              <div className="flex flex-row w-full">
                <div className="flex flex-col border  p-2  w-[10%]">
                  <div className="text-center">{player1}</div>
                  <div className="text-center">{player2}</div>
                </div>
                {history.map((el,index)=><div key={index} className="flex flex-col border  p-2">
                  <div>{el.score1}</div>
                  <div>{el.score2}</div>
                </div>)}
                <div className="flex flex-col border  p-2  w-[5%]">
                  <div className="text-center">{total(1)}</div>
                  <div className="text-center">{total(2)}</div>
                </div>
                <div className="flex flex-col border  p-2  w-[10%]">
                  <div className="text-center">{sumPoint(1).toFixed(1)}</div>
                  <div className="text-center">{sumPoint(2).toFixed(1)}</div>
                </div>
              </div>
              
              <div>
                  {
                    history.map((el,index)=><div key={index}>
                        Матч {index+1}: {el.player1} - {el.player2} ({el.score1} - {el.score2}) ({el.point1.toFixed(1)} - {el.point2.toFixed(1)})
                    </div>)
                  }
              </div>
            </div>
                
            <div style={{ marginTop: 'auto' }}>
               {/* <Footer />*/}
            </div>
        </div>
    )
}

export default Test;