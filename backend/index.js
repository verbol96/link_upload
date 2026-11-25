
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
const {startTelegramPolling}=require('./services/telegram');
const myFilesService = require('./services/myFilesService');

const app = express()
const PORT = process.env.PORT

app.use(fileUpload({
    defCharset: 'utf8',
    defParamCharset: 'utf8'
}));
app.use(bodyParser.json({ limit: '70mb' }));
app.use(bodyParser.urlencoded({ limit: '70mb', extended: true }));
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: process.env.STATUS === 'release'
        ? [
            'https://link1.by',
            'https://www.link1.by',
            'https://api.express-pay.by',
            'http://link1.by',
            'http://www.link1.by',
        ]
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://192.168.1.2:3000',
            'http://192.168.8.167:3000'
        ]
}));

app.use('/api', router)

let server;
if (process.env.STATUS === 'release') {
    const httpsOptions = {
        key: fs.readFileSync('/etc/nginx/ssl/link1.by-new.key'),
        cert: fs.readFileSync('/etc/nginx/ssl/link1.by-new.crt')
    };
    server = https.createServer(httpsOptions, app);
} else {
    server = app;
}

// Очистка просроченных черновиков раз в час
const CLEANUP_INTERVAL = 60 * 60 * 1000;
let cleanupRunning = false;

const runDraftCleanup = async () => {
    if (cleanupRunning) return;

    cleanupRunning = true;

    try {
        await myFilesService.cleanupExpiredDrafts();
    } catch (error) {
        console.error('[MyFiles] Ошибка планировщика:', error);
    } finally {
        cleanupRunning = false;
    }
};

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        // Проверяем просроченные черновики при запуске
        await runDraftCleanup();

        // Затем повторяем проверку каждый час
        const cleanupTimer = setInterval(
            runDraftCleanup,
            CLEANUP_INTERVAL
        );
        cleanupTimer.unref();

        server.listen(PORT, () => {
            console.log(`${process.env.STATUS === 'release' ? ' Server' : 'Local server'} started on port ${PORT}`);
            //startTelegramPolling();
        });

    } catch (error) {
        console.log(error);
    }
};

start()
