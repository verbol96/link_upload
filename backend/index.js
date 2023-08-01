const express = require('express')
require('dotenv').config()
const sequelize = require('./db')
const router = require('./routes/indexRoute')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser');

const app = express()
const PORT = process.env.PORT

app.use(fileUpload({}))
app.use(bodyParser.json({ limit: '10mb' })); // ограничение на обьем данных в запросе, увеличил для миграциии БД
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json())
app.use(cookieParser())
app.use(cors(
    {
        credentials: true,
        //origin: 'http://85.193.91.221:8080'
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