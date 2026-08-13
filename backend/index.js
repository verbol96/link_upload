const express = require('express')
require('dotenv').config()
const sequelize = require('./db')
const router = require('./routes/indexRoute')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');

const app = express()
const PORT = process.env.PORT

const status = 'release'// release, local

app.use(fileUpload({}))
app.use(bodyParser.json({ limit: '70mb' })); // ограничение на обьем данных в запросе, увеличил для миграциии БД
app.use(bodyParser.urlencoded({ limit: '70mb', extended: true }));
app.use(express.json())
app.use(cookieParser())
app.use(cors({
  credentials: true,
  origin: status === 'release' 
    ? ['https://link1.by', 'https://api.express-pay.by'] 
    : ['http://localhost:3000', 'http://localhost:5173']
}));

app.use('/api', router)

let server;
if (status === 'release') {
  const httpsOptions = {
    key: fs.readFileSync('/etc/nginx/ssl/link1.by-new.key'),
    cert: fs.readFileSync('/etc/nginx/ssl/link1.by-new.crt')
  };
  server = https.createServer(httpsOptions, app);
} else {
  server = app;
}

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    server.listen(PORT, () => console.log(`${status === 'release' ? ' Server' : 'Local server'} started on port ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};

start()