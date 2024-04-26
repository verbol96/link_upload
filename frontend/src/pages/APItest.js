import { useState } from "react";
import Footer from "../components/admin/Footer";
import { NavBar } from '../components/admin/NavBar';
import axios from "axios";

const APItest = () => {

    const [jwt, setGWT] = useState('')

    const getJWT = async() =>{
        const data = await axios.post('https://api.eurotorg.by:10352/Json', {
            "CRC":"",
            "Packet":{
               "JWT":"null",
               "MethodName": "GetJWT",
               "ServiceNumber":"[58DDAE9D-545D-4059-9387-8E71C3BCF202]",
               "Data":{
                   "LoginName":"[591870601_Verbol']",
                   "Password":"[3IOSGZVLTD86JP4]",
                   "LoginNameTypeId":"[1]" 
               }
            }
        })
        console.log(data)
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <NavBar />
            
            <div style={{display: 'flex', justifyContent: 'center', color: '#116466', margin: 20, fontSize: 25}}>Tестирование API</div>
            
            <div>
                <button onClick={()=>getJWT()}>получить JWT</button>
                <span> JWT = {jwt}</span>
            </div>
            
                
            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    )
}

export default APItest;