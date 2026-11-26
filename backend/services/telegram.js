
const {User}=require('../models/models');
const {createTelegramOrder}=require('./telegramOrderService');

// Локально — Telegram напрямую, на сервере — через Амстердам
const TELEGRAM_API_BASE=process.env.STATUS==='release'
    ?'https://tg.link1.by/telegram-api'
    :'https://api.telegram.org';

const MAIN_KEYBOARD={
    keyboard:[
        [
            {text:'Создать'},
            {text:'Инфо'},
            {text:'Очистить'}
        ]
    ],
    resize_keyboard:true,
    is_persistent:true
};

const sendTelegramMessage=async(text,replyMarkup=null,targetChatId=null)=>{
    try{
        const token=process.env.TELEGRAM_BOT_TOKEN;
        const chatId=targetChatId||process.env.TELEGRAM_CHAT_ID;

        if(!token||!chatId){
            console.error('Telegram: не указан TELEGRAM_BOT_TOKEN или chatId');
            return;
        }

        const body={
            chat_id:chatId,
            text,
            parse_mode:'HTML',
            reply_markup:replyMarkup||MAIN_KEYBOARD
        };

        const response=await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify(body)
        });

        if(!response.ok){
            const error=await response.text();
            console.error('Telegram error:',error);
        }
    }catch(error){
        console.error('Ошибка отправки Telegram:',error.message);
    }
};

const answerCallbackQuery=async(callbackQueryId)=>{
    try{
        const token=process.env.TELEGRAM_BOT_TOKEN;

        await fetch(`${TELEGRAM_API_BASE}/bot${token}/answerCallbackQuery`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                callback_query_id:callbackQueryId
            })
        });
    }catch(error){
        console.error('Telegram callback error:',error.message);
    }
};

const telegramBatches=new Map();
const telegramStates=new Map();
const skippedBatches=new Map();

const MAX_FILE_SIZE=20*1024*1024;

const isAllowedChat=chatId=>{
    return [
        String(process.env.TELEGRAM_CHAT_ID||''),
        String(process.env.TELEGRAM_WORK_CHAT_ID||'')
    ].includes(String(chatId));
};

const getTelegramBatch=chatId=>{
    if(!telegramBatches.has(chatId)){
        telegramBatches.set(chatId,[]);
    }

    return telegramBatches.get(chatId);
};

const getSkipped=chatId=>{
    if(!skippedBatches.has(chatId)){
        skippedBatches.set(chatId,[]);
    }

    return skippedBatches.get(chatId);
};

const resetBatch=chatId=>{
    telegramBatches.delete(chatId);
    skippedBatches.delete(chatId);
};

const clearOrder=chatId=>{
    telegramBatches.delete(chatId);
    telegramStates.delete(chatId);
};

const escapeHTML=value=>String(value??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');

const groupNote=g=>{
    return `${g.notes} (${g.files.length} файлов${g.skipped.length?` + ${g.skipped.length} вручную`:''})`;
};

const normalizePhone=phone=>{
    let value=String(phone||'').replace(/\D/g,'');

    if(value.length===9){
        value=`375${value}`;
    }

    if(value.startsWith('80')&&value.length===11){
        value=`375${value.slice(2)}`;
    }

    if(value.length!==12||!value.startsWith('375')){
        return null;
    }

    return `+${value}`;
};

// Одна попытка скачивания файла
const downloadTelegramFileOnce=async(fileId,fileName,expectedSize)=>{
    const token=process.env.TELEGRAM_BOT_TOKEN;

    const response=await fetch(
        `${TELEGRAM_API_BASE}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
        {
            signal:AbortSignal.timeout(30000)
        }
    );

    const data=await response.json();

    if(!data.ok){
        throw new Error('Telegram: не удалось получить путь к файлу');
    }

    const fileResponse=await fetch(
        `${TELEGRAM_API_BASE}/file/bot${token}/${data.result.file_path}`,
        {
            signal:AbortSignal.timeout(60000)
        }
    );

    if(!fileResponse.ok){
        throw new Error('Telegram: не удалось скачать файл');
    }

    const buffer=Buffer.from(await fileResponse.arrayBuffer());

    if(!buffer.length||(expectedSize!=null&&buffer.length!==expectedSize)){
        throw new Error('Telegram: неполный файл');
    }

    return {
        buffer,
        fileName,
        size:buffer.length
    };
};

// До трёх попыток скачивания
const downloadTelegramFile=async(fileId,fileName,size)=>{
    for(let attempt=1;attempt<=3;attempt++){
        try{
            return await downloadTelegramFileOnce(
                fileId,
                fileName,
                size
            );
        }catch(error){
            if(attempt===3){
                throw error;
            }

            await new Promise(
                resolve=>setTimeout(resolve,1000*attempt)
            );
        }
    }
};

const showOwnerButtons=async(chatId)=>{
    await sendTelegramMessage(
        '👤 <b>Чей заказ?</b>',
        {
            inline_keyboard:[
                [
                    {
                        text:'Клиент',
                        callback_data:'owner_client'
                    },
                    {
                        text:'Нефедьев',
                        callback_data:'owner_nefediev'
                    }
                ]
            ]
        },
        chatId
    );
};

const showOrderSummary=async(chatId)=>{
    const state=telegramStates.get(chatId);

    const client=state.clientId
        ?await User.findOne({
            where:{id:state.clientId}
        })
        :null;

    await sendTelegramMessage(
        `👤 <b>${escapeHTML(client?.FIO||'Новый клиент')}</b>\n`+
        `📱 ${state.phone}\n`+
        `👥 Владелец: ${state.ownerType==='nefediev'?'Нефедьев':'Клиент'}\n\n`+
        state.groups.map((g,i)=>
            `${i+1}. ${escapeHTML(groupNote(g))}`
        ).join('\n')+
        `\n\n📎 Всего: ${state.groups.reduce((n,g)=>n+g.files.length,0)} файлов`,
        {
            inline_keyboard:[
                [
                    {
                        text:'➕ Добавить формат',
                        callback_data:'add_format'
                    }
                ],
                [
                    {
                        text:'✅ Создать заказ',
                        callback_data:'create_order'
                    },
                    {
                        text:'❌ Отмена',
                        callback_data:'cancel_order'
                    }
                ]
            ]
        },
        chatId
    );
};

// Повторная отправка пропущенных файлов
const copySkipped=async(chatId,groups)=>{
    for(const [i,g] of groups.entries()){
        for(const file of g.skipped){
            await sendTelegramMessage(
                `⚠️ Формат №${i+1}: ${escapeHTML(g.notes)}\n`+
                `${escapeHTML(file.fileName)} — скачать вручную`,
                null,
                chatId
            );

            try{
                const response=await fetch(
                    `${TELEGRAM_API_BASE}/bot${process.env.TELEGRAM_BOT_TOKEN}/copyMessage`,
                    {
                        method:'POST',
                        headers:{
                            'Content-Type':'application/json'
                        },
                        body:JSON.stringify({
                            chat_id:chatId,
                            from_chat_id:chatId,
                            message_id:file.messageId
                        })
                    }
                );

                const data=await response.json();

                if(!response.ok||!data.ok){
                    throw new Error('copyMessage failed');
                }
            }catch(error){
                await sendTelegramMessage(
                    'Не удалось повторно отправить файл. Скачайте исходное сообщение вручную.',
                    null,
                    chatId
                );
            }
        }
    }
};

const handleTelegramCallback=async(callbackQuery)=>{
    const chatId=String(callbackQuery.message?.chat?.id||'');

    if(!isAllowedChat(chatId))return;

    await answerCallbackQuery(callbackQuery.id);

    const state=telegramStates.get(chatId);

    if(state?.step==='creating')return;

    const action=callbackQuery.data;

    // Отказ от очистки
    if(action==='keep_order'){
        return sendTelegramMessage(
            'Продолжаем оформление.',
            null,
            chatId
        );
    }

    // Подтверждение очистки
    if(action==='clear_confirm'){
        clearOrder(chatId);
        resetBatch(chatId);

        return sendTelegramMessage(
            'Все пачки очищены.',
            null,
            chatId
        );
    }

    if(!state)return;

    // Выбор владельца
    if(state.step==='owner'&&['owner_client','owner_nefediev'].includes(action)){
        state.ownerType=action==='owner_client'
            ?'client'
            :'nefediev';

        state.step='note';

        return sendTelegramMessage(
            '📝 <b>Введи примечание к заказу:</b>',
            null,
            chatId
        );
    }

    // Отмена всего заказа
    if(action==='cancel_order'){
        clearOrder(chatId);
        resetBatch(chatId);

        return sendTelegramMessage(
            '🗑 <b>Заказ отменён. Все пачки очищены.</b>',
            null,
            chatId
        );
    }

    if(state.step!=='ready')return;

    // Добавление следующего формата
    if(action==='add_format'){
        state.step='collect';

        return sendTelegramMessage(
            '📎 <b>Перешли фотографии следующего формата.</b>\n'+
            'Затем нажми «Создать».',
            null,
            chatId
        );
    }

    if(action!=='create_order')return;

    // Создание заказа
    state.step='creating';

    const groups=state.groups;

    let count=groups.reduce(
        (n,g)=>n+g.files.length,0
    );

    let skipped=groups.reduce(
        (n,g)=>n+g.skipped.length,0
    );

    await sendTelegramMessage(
        `⏳ <b>Создаю заказ...</b>\n📎 Файлов: ${count}`,
        null,
        chatId
    );

    let result;

    try{
        result=await createTelegramOrder({
            clientId:state.clientId,
            phone:state.phone,
            ownerType:state.ownerType,
            notes:groups.map(groupNote).join('\n'),
            groups,
            downloadTelegramFile
        });
    }catch(error){
        console.error('Telegram: ошибка создания заказа:',error);

        state.step='ready';

        await sendTelegramMessage(
            `❌ <b>Не удалось создать заказ</b>\n`+
            escapeHTML(error.message),
            null,
            chatId
        );

        return showOrderSummary(chatId);
    }

    // Фактические результаты скачивания
    const completedGroups=result.groups;

    count=completedGroups.reduce(
        (n,g)=>n+g.files.length,0
    );

    skipped=completedGroups.reduce(
        (n,g)=>n+g.skipped.length,0
    );

    clearOrder(chatId);
    resetBatch(chatId);

    await sendTelegramMessage(
        `✅ <b>Заказ №${result.order.order_number} создан</b>\n`+
        `👤 ${escapeHTML(result.client.FIO||'Без имени')}\n`+
        `📱 ${state.phone}\n`+
        `📎 Загружено: ${count}\n`+
        `📁 ${escapeHTML(result.mainDir.name)}\n`+
        `${escapeHTML(completedGroups.map(groupNote).join('\n'))}\n`+
        `⚠️ Вручную: ${skipped}`,
        null,
        chatId
    );

    await copySkipped(chatId,completedGroups);
};

const handleTelegramUpdate=async(update)=>{
    if(update.callback_query){
        return handleTelegramCallback(update.callback_query);
    }

    const message=update.message;

    if(!message)return;

    const chatId=String(message.chat?.id||'');

    if(!isAllowedChat(chatId))return;

    const state=telegramStates.get(chatId);

    if(state?.step==='creating')return;

    const batch=getTelegramBatch(chatId);
    const skipped=getSkipped(chatId);

    const command=message.text?.trim();

    // Отображение постоянной клавиатуры
    if(command==='/start'){
        return sendTelegramMessage(
            'Перешли фотографии и нажми «Создать».',
            null,
            chatId
        );
    }

    // Очистка заказа
    if(command==='/cancel'||command==='Очистить'){
        if(!state&&!batch.length&&!skipped.length){
            return sendTelegramMessage(
                'Пачки пусты.',
                null,
                chatId
            );
        }

        return sendTelegramMessage(
            'Очистить весь незавершённый заказ?',
            {
                inline_keyboard:[
                    [
                        {
                            text:'Очистить',
                            callback_data:'clear_confirm'
                        },
                        {
                            text:'Нет',
                            callback_data:'keep_order'
                        }
                    ]
                ]
            },
            chatId
        );
    }

    // Информация о текущем заказе
    if(command==='/count'||command==='Инфо'){
        const groups=state?.groups||[];

        const client=state?.clientId
            ?await User.findOne({
                where:{id:state.clientId}
            })
            :null;

        const count=groups.reduce(
            (n,g)=>n+g.files.length,
            batch.length
        );

        const manual=groups.reduce(
            (n,g)=>n+g.skipped.length,
            skipped.length
        );

        return sendTelegramMessage(
            [
                state?.phone
                    ?`Клиент: ${escapeHTML(client?.FIO||'Без имени')} — ${state.phone}`
                    :'Клиент не выбран',

                state?.ownerType
                    ?`Владелец: ${state.ownerType==='nefediev'?'Нефедьев':'Клиент'}`
                    :'',

                ...groups.map((g,i)=>
                    `${i+1}. ${escapeHTML(groupNote(g))}`
                ),

                `Текущая пачка: ${batch.length} файлов`,
                `Всего для загрузки: ${count}`,
                `Вручную: ${manual}`
            ].filter(Boolean).join('\n'),
            null,
            chatId
        );
    }

    // Оформление заказа или следующего формата
    if(command==='/order'||command==='Создать'){
        if(state?.step==='ready'){
            return showOrderSummary(chatId);
        }

        if(!batch.length&&!skipped.length){
            return sendTelegramMessage(
                '⚠️ В текущей пачке нет файлов',
                null,
                chatId
            );
        }

        if(state?.step==='collect'){
            state.step='note';

            return sendTelegramMessage(
                '📝 <b>Введи примечание к новому формату:</b>',
                null,
                chatId
            );
        }

        if(state?.step==='phone'){
            return sendTelegramMessage(
                'Введи номер телефона клиента.',
                null,
                chatId
            );
        }

        if(state?.step==='owner'){
            return showOwnerButtons(chatId);
        }

        if(state?.step==='note'){
            return sendTelegramMessage(
                'Введи примечание.',
                null,
                chatId
            );
        }

        if(state)return;

        telegramStates.set(chatId,{
            step:'phone',
            groups:[]
        });

        return sendTelegramMessage(
            `📎 Файлов: ${batch.length}\n`+
            '📱 Введи номер телефона клиента:',
            null,
            chatId
        );
    }

    // Номер телефона
    if(state?.step==='phone'&&message.text){
        const phone=normalizePhone(message.text);

        if(!phone){
            return sendTelegramMessage(
                '⚠️ Введи номер телефона ещё раз:',
                null,
                chatId
            );
        }

        const client=await User.findOne({
            where:{phone}
        });

        Object.assign(state,{
            step:'owner',
            phone,
            clientId:client?.id||null
        });

        await sendTelegramMessage(
            `👤 <b>${escapeHTML(client?.FIO||(client?'Без имени':'Новый клиент'))}</b>\n`+
            `📱 ${phone}`,
            null,
            chatId
        );

        return showOwnerButtons(chatId);
    }

    // Сохранение группы фотографий
    if(state?.step==='note'&&message.text){
        const notes=message.text.trim();

        if(!notes){
            return sendTelegramMessage(
                '⚠️ Введи примечание ещё раз',
                null,
                chatId
            );
        }

        state.groups.push({
            notes,
            files:[...batch],
            skipped:[...skipped]
        });

        resetBatch(chatId);

        state.step='ready';

        return showOrderSummary(chatId);
    }

    // Получение фотографий и документов
    if(message.document||message.photo){
        if(state?.step==='ready'){
            return sendTelegramMessage(
                'Сначала нажми «Добавить формат», затем перешли файл повторно.',
                null,
                chatId
            );
        }

        const file=message.document||
            message.photo[message.photo.length-1];

        const item={
            fileId:file.file_id,
            fileName:file.file_name||`telegram_${message.message_id}.jpg`,
            size:file.file_size,
            messageId:message.message_id
        };

        // Файлы больше 20 МБ сохраняем отдельно
        if(item.size>MAX_FILE_SIZE){
            skipped.push(item);

            return sendTelegramMessage(
                `⚠️ ${escapeHTML(item.fileName)} больше 20 МБ. `+
                'Будет отправлен для ручного скачивания после создания заказа.',
                null,
                chatId
            );
        }

        // Обычные файлы принимаем без сообщений
        batch.push(item);
        return;
    }
};

const startTelegramPolling=async()=>{
    if(process.env.STATUS!=='local')return;

    const token=process.env.TELEGRAM_BOT_TOKEN;

    if(!token){
        console.error('Telegram polling: не указан TELEGRAM_BOT_TOKEN');
        return;
    }

    let offset=0;

    console.log('Telegram polling запущен');

    while(true){
        try{
            const response=await fetch(
                `${TELEGRAM_API_BASE}/bot${token}/getUpdates?timeout=30&offset=${offset}`
            );

            const data=await response.json();

            if(!data.ok){
                console.error('Telegram polling error:',data);

                await new Promise(
                    resolve=>setTimeout(resolve,3000)
                );

                continue;
            }

            for(const update of data.result){
                offset=update.update_id+1;

                await handleTelegramUpdate(update);
            }
        }catch(error){
            console.error('Telegram polling error:',error.message);

            await new Promise(
                resolve=>setTimeout(resolve,3000)
            );
        }
    }
};

module.exports={
    sendTelegramMessage,
    handleTelegramUpdate,
    startTelegramPolling
};
