const {User}=require('../models/models');
const {createTelegramOrder}=require('./telegramOrderService');

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
            parse_mode:'HTML'
        };

        if(replyMarkup){
            body.reply_markup=replyMarkup;
        }

        const response=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
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

        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`,{
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

const isAllowedChat=(chatId)=>{
    return [
        String(process.env.TELEGRAM_CHAT_ID||''),
        String(process.env.TELEGRAM_WORK_CHAT_ID||'')
    ].includes(String(chatId));
};

const getTelegramBatch=(chatId)=>{
    if(!telegramBatches.has(chatId)){
        telegramBatches.set(chatId,[]);
    }

    return telegramBatches.get(chatId);
};

const normalizePhone=(phone)=>{
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

const downloadTelegramFile=async(fileId,fileName)=>{
    const token=process.env.TELEGRAM_BOT_TOKEN;

    const response=await fetch(
        `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
    );

    const data=await response.json();

    if(!data.ok){
        throw new Error('Telegram: не удалось получить путь к файлу');
    }

    const fileResponse=await fetch(
        `https://api.telegram.org/file/bot${token}/${data.result.file_path}`
    );

    if(!fileResponse.ok){
        throw new Error('Telegram: не удалось скачать файл');
    }

    const buffer=Buffer.from(await fileResponse.arrayBuffer());

    return {
        buffer,
        fileName,
        size:buffer.length
    };
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
    const batch=getTelegramBatch(chatId);

    if(!state)return;

    const client=state.clientId
        ?await User.findOne({where:{id:state.clientId}})
        :null;

    const ownerName=state.ownerType==='nefediev'
        ?'Нефедьев'
        :'Клиент';

    await sendTelegramMessage(
        `👤 <b>${client?.FIO||'Новый клиент'}</b>\n`+
        `📱 ${state.phone}\n`+
        `👥 Владелец: <b>${ownerName}</b>\n`+
        `📎 Файлов: ${batch.length}\n`+
        `📝 Примечание: <b>${state.notes}</b>`,
        {
            inline_keyboard:[
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

const handleTelegramCallback=async(callbackQuery)=>{
    const chatId=String(callbackQuery.message?.chat?.id||'');

    if(!isAllowedChat(chatId)){
        console.log('Telegram: callback от неизвестного chatId:',chatId);
        return;
    }

    await answerCallbackQuery(callbackQuery.id);

    const state=telegramStates.get(chatId);

    if(!state)return;

    if(callbackQuery.data==='owner_client'&&state.step==='owner'){
        telegramStates.set(chatId,{
            ...state,
            step:'note',
            ownerType:'client'
        });

        await sendTelegramMessage(
            '📝 <b>Введи примечание к заказу:</b>',
            null,
            chatId
        );

        return;
    }

    if(callbackQuery.data==='owner_nefediev'&&state.step==='owner'){
        telegramStates.set(chatId,{
            ...state,
            step:'note',
            ownerType:'nefediev'
        });

        await sendTelegramMessage(
            '📝 <b>Введи примечание к заказу:</b>',
            null,
            chatId
        );

        return;
    }

    if(callbackQuery.data==='cancel_order'){
        telegramBatches.set(chatId,[]);
        telegramStates.delete(chatId);

        await sendTelegramMessage(
            '🗑 <b>Заказ отменён. Пачка очищена.</b>',
            null,
            chatId
        );

        return;
    }

    if(callbackQuery.data==='create_order'&&state.step==='ready'){
        const batch=getTelegramBatch(chatId);

        if(batch.length===0){
            await sendTelegramMessage(
                '⚠️ <b>Пачка файлов пуста</b>',
                null,
                chatId
            );

            return;
        }

        telegramStates.set(chatId,{
            ...state,
            step:'creating'
        });

        await sendTelegramMessage(
            `⏳ <b>Создаю заказ...</b>\n📎 Файлов: ${batch.length}`,
            null,
            chatId
        );

        try{
            const result=await createTelegramOrder({
                clientId:state.clientId,
                phone:state.phone,
                ownerType:state.ownerType,
                notes:state.notes,
                files:batch,
                downloadTelegramFile
            });

            telegramBatches.set(chatId,[]);
            telegramStates.delete(chatId);

            await sendTelegramMessage(
                `✅ <b>Заказ №${result.order.order_number} создан</b>\n\n`+
                `👤 ${result.client.FIO||'Без имени'}\n`+
                `📱 ${result.client.phone}\n`+
                `👥 Владелец: ${state.ownerType==='nefediev'?'Нефедьев':'Клиент'}\n`+
                `📎 Файлов: ${batch.length}\n`+
                `📝 ${state.notes}\n`+
                `📁 ${result.mainDir.name}`,
                null,
                chatId
            );
        }catch(error){
            console.error('Telegram: ошибка создания заказа:',error);

            telegramStates.set(chatId,{
                ...state,
                step:'ready'
            });

            await sendTelegramMessage(
                `❌ <b>Не удалось создать заказ</b>\n\n${error.message||'Неизвестная ошибка'}`,
                null,
                chatId
            );
        }

        return;
    }
};

const handleTelegramUpdate=async(update)=>{
    if(update.callback_query){
        await handleTelegramCallback(update.callback_query);
        return;
    }

    const message=update.message;

    if(!message)return;

    const chatId=String(message.chat?.id||'');

    if(!isAllowedChat(chatId)){
        console.log('Telegram: сообщение от неизвестного chatId:',chatId);
        return;
    }

    if(message.text==='/count'){
        const batch=getTelegramBatch(chatId);

        await sendTelegramMessage(
            `📎 <b>Файлов в текущей пачке: ${batch.length}</b>`,
            null,
            chatId
        );

        return;
    }

    if(message.text==='/cancel'){
        telegramBatches.set(chatId,[]);
        telegramStates.delete(chatId);

        await sendTelegramMessage(
            '🗑 <b>Текущая пачка очищена</b>',
            null,
            chatId
        );

        return;
    }

    if(message.text==='/order'){
        const batch=getTelegramBatch(chatId);

        if(batch.length===0){
            await sendTelegramMessage(
                '⚠️ <b>В текущей пачке нет файлов</b>',
                null,
                chatId
            );

            return;
        }

        telegramStates.set(chatId,{
            step:'phone'
        });

        await sendTelegramMessage(
            `📎 <b>Файлов: ${batch.length}</b>\n\n📱 Введи номер телефона клиента:`,
            null,
            chatId
        );

        return;
    }

    const state=telegramStates.get(chatId);

    if(state?.step==='phone'&&message.text){
        const phone=normalizePhone(message.text);

        if(!phone){
            await sendTelegramMessage(
                '⚠️ <b>Не удалось распознать номер</b>\n\nВведи номер телефона ещё раз:',
                null,
                chatId
            );

            return;
        }

        const client=await User.findOne({
            where:{phone}
        });

        telegramStates.set(chatId,{
            ...state,
            step:'owner',
            phone,
            clientId:client?.id||null
        });

        const batch=getTelegramBatch(chatId);

        if(client){
            await sendTelegramMessage(
                `👤 <b>${client.FIO||'Без имени'}</b>\n`+
                `📱 ${phone}\n`+
                `📎 Файлов: ${batch.length}\n\n`+
                `Клиент найден в LINK.`,
                null,
                chatId
            );
        }else{
            await sendTelegramMessage(
                `👤 <b>Новый клиент</b>\n`+
                `📱 ${phone}\n`+
                `📎 Файлов: ${batch.length}\n\n`+
                `Такого клиента в LINK пока нет.`,
                null,
                chatId
            );
        }

        await showOwnerButtons(chatId);
        return;
    }

    if(state?.step==='note'&&message.text){
        const notes=message.text.trim();

        if(!notes){
            await sendTelegramMessage(
                '⚠️ <b>Введи примечание ещё раз</b>',
                null,
                chatId
            );

            return;
        }

        telegramStates.set(chatId,{
            ...state,
            step:'ready',
            notes
        });

        await showOrderSummary(chatId);
        return;
    }

    if(message.document){
        const file=message.document;
        const batch=getTelegramBatch(chatId);

        batch.push({
            fileId:file.file_id,
            fileName:file.file_name,
            size:file.file_size
        });

        console.log('Telegram файл добавлен в пачку:',{
            name:file.file_name,
            size:file.file_size,
            count:batch.length,
            chatId
        });

        await sendTelegramMessage(
            `📎 <b>Получено файлов: ${batch.length}</b>`,
            null,
            chatId
        );

        return;
    }

    if(message.photo){
        const photo=message.photo[message.photo.length-1];
        const batch=getTelegramBatch(chatId);
        const fileName=`telegram_${message.message_id}.jpg`;

        batch.push({
            fileId:photo.file_id,
            fileName,
            size:photo.file_size
        });

        console.log('Telegram фото добавлено в пачку:',{
            name:fileName,
            size:photo.file_size,
            count:batch.length,
            chatId
        });

        await sendTelegramMessage(
            `📎 <b>Получено файлов: ${batch.length}</b>`,
            null,
            chatId
        );

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
                `https://api.telegram.org/bot${token}/getUpdates?timeout=30&offset=${offset}`
            );

            const data=await response.json();

            if(!data.ok){
                console.error('Telegram polling error:',data);
                await new Promise(resolve=>setTimeout(resolve,3000));
                continue;
            }

            for(const update of data.result){
                offset=update.update_id+1;
                await handleTelegramUpdate(update);
            }
        }catch(error){
            console.error('Telegram polling error:',error.message);
            await new Promise(resolve=>setTimeout(resolve,3000));
        }
    }
};

module.exports={
    sendTelegramMessage,
    handleTelegramUpdate,
    startTelegramPolling
};