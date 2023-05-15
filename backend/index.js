const express = require('express')
require('dotenv').config()
const sequelize = require('./db')
const router = require('./routes/indexRoute')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')

const app = express()
const PORT = process.env.PORT

app.use(fileUpload({}))
app.use(express.json())
app.use(cookieParser())
app.use(cors(
    {
        credentials: true,
        //origin: 'http://94.228.126.26:8080'
        origin: 'http://localhost:3000'
    }
))
app.use('/api', router)

const start = async() =>{
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        app.listen(PORT, ()=> console.log(`server started! ${PORT}`))
    } catch (error) {
        console.log(error)
    }
}

start()