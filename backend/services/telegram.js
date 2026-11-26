
const {User}=require('../models/models');
const {createTelegramOrder}=require('./telegramOrderService');

// Локально — Telegram напрямую, на сервере — через Амстердам
const TELEGRAM_API_BASE=process.env.STATUS==='release'
    ?'https://tg.link1.by/telegram-api'
    :'https://api.telegram.org';

const MAIN_KEYBOARD={keyboard:[[{text:'✈️'},{text:'+ Папка'},{text:'Инфо'},{text:'Очистить'}]],resize_keyboard:true,is_persistent:true};

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

        body.reply_markup=replyMarkup||MAIN_KEYBOARD;

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

const downloadTelegramFileOnce=async(fileId,fileName,expectedSize)=>{
    const token=process.env.TELEGRAM_BOT_TOKEN;

    const response=await fetch(
        `${TELEGRAM_API_BASE}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
        {signal:AbortSignal.timeout(30000)}
    );

    const data=await response.json();

    if(!data.ok){
        throw new Error('Telegram: не удалось получить путь к файлу');
    }

    const fileResponse=await fetch(
        `${TELEGRAM_API_BASE}/file/bot${token}/${data.result.file_path}`,
        {signal:AbortSignal.timeout(60000)}
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

const downloadTelegramFile=async(fileId,fileName,size)=>{
    for(let attempt=1;attempt<=3;attempt++){
        try{
            return await downloadTelegramFileOnce(fileId,fileName,size);
        }catch(error){
            if(attempt===3)throw error;
            await new Promise(resolve=>setTimeout(resolve,1000*attempt));
        }
    }
};

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

const sessions=new Map();
const MAX_FILE_SIZE=20*1024*1024;
const isAllowedChat=id=>!!id&&[process.env.TELEGRAM_CHAT_ID,process.env.TELEGRAM_WORK_CHAT_ID].some(v=>v&&String(v)===id);
const emptyFolder=()=>({notes:'',files:[],skipped:[]});
let sequence=0;
const getSession=id=>{
    if(!sessions.has(id))sessions.set(id,{folders:[emptyFolder()],active:0,step:'collect',version:++sequence});
    return sessions.get(id);
};
const say=(id,text,rows)=>sendTelegramMessage(text,rows?{inline_keyboard:rows}:null,id);
const btn=(s,text,action)=>({text,callback_data:`${s.version}:${action}`});
const count=g=>g.files.length+g.skipped.length;
const total=s=>s.folders.reduce((n,g)=>n+count(g),0);
const summary=s=>s.folders.map((g,i)=>`📂 <b>Папка ${i+1}${i===s.active?' — открыта':''}</b>\nФайлов: ${count(g)}${g.skipped.length?` (${g.skipped.length} вручную)`:''}\nПримечание: ${escapeHTML(g.notes||'—')}`).join('\n\n')+`\n\nВсего файлов: ${total(s)}`;
const folderRows=(s,action)=>{
    const rows=[];
    s.folders.forEach((g,i)=>{
        if(i%3===0)rows.push([]);
        rows[rows.length-1].push(btn(s,`Папка ${i+1}${action==='open'&&i===s.active?' ✓':''}`,`${action}_${i}`));
    });
    return rows;
};
const info=(id,s)=>say(id,summary(s),[[btn(s,'Редактировать примечание','edit')],...folderRows(s,'open')]);
const opened=(id,s)=>say(id,`📂 <b>Открыта папка ${s.active+1}</b>\nФайлов: ${count(s.folders[s.active])}\nПрисылайте фотографии и примечания.`);
const appendNote=(g,text)=>{if(text?.trim())g.notes=[g.notes,text.trim()].filter(Boolean).join('\n');};
const resetFlow=s=>{s.step='collect';delete s.phone;delete s.clientId;delete s.clientName;delete s.ownerType;s.version=++sequence;};
const confirm=(id,s)=>say(id,`👤 ${escapeHTML(s.clientName)}\n📱 ${s.phone}\nВладелец: ${s.ownerType==='nefediev'?'Нефедьев':'Клиент'}\n\n${summary(s)}`,[[btn(s,'Подтвердить отправку','send'),btn(s,'Отмена','back')]]);
const handleTelegramCallback=async(q)=>{
    const id=String(q.message?.chat?.id||'');
    if(!isAllowedChat(id))return;
    await answerCallbackQuery(q.id);
    const s=getSession(id);
    if(s.step==='creating')return;
    const [version,action]=String(q.data||'').split(':');
    if(version!==String(s.version))return;
    if(action==='back'){resetFlow(s);return info(id,s);}
    if(action==='begin'&&s.step==='preview'){
        s.step='phone';return say(id,'📱 Введите номер телефона клиента:');
    }
    if(s.step==='owner'&&['client','nefediev'].includes(action)){
        s.ownerType=action;s.step='confirm';return confirm(id,s);
    }
    if(action==='send'&&s.step==='confirm'){
        s.step='creating';
        const groups=s.folders.filter(g=>count(g));
        await say(id,`⏳ Создаю заказ...\nФайлов: ${total(s)}`);
        let result;
        try{
            result=await createTelegramOrder({clientId:s.clientId,phone:s.phone,ownerType:s.ownerType,notes:groups.map(groupNote).join('\n'),groups,downloadTelegramFile});
        }catch(error){
            console.error('Telegram: ошибка создания заказа:',error);
            s.step='confirm';await say(id,`❌ ${escapeHTML(error.message)}`);return confirm(id,s);
        }
        const done=result.groups;
        const loaded=done.reduce((n,g)=>n+g.files.length,0);
        const manual=done.reduce((n,g)=>n+g.skipped.length,0);
        await say(id,`✅ <b>Заказ №${result.order.order_number} создан</b>\n👤 ${escapeHTML(result.client.FIO||'Без имени')}\n📱 ${s.phone}\n📁 ${escapeHTML(result.mainDir.name)}\n${escapeHTML(done.map(groupNote).join('\n'))}\nЗагружено: ${loaded}\nВручную: ${manual}`);
        try{await copySkipped(id,done);}finally{sessions.delete(id);}
        return;
    }
    if(!['collect','edit'].includes(s.step))return;
    if(action==='edit'){s.step='edit';return say(id,`Введите новое примечание для папки ${s.active+1}. Чтобы удалить примечание, отправьте «-».`);}
    if(action==='clear_all'){sessions.delete(id);return opened(id,getSession(id));}
    const match=/^(open|clear)_(\d+)$/.exec(action);
    if(!match)return;
    const i=Number(match[2]);
    if(!s.folders[i])return;
    s.step='collect';s.version=++sequence;
    if(match[1]==='open'){s.active=i;return opened(id,s);}
    s.folders[i]=emptyFolder();return say(id,`Папка ${i+1} очищена.`);
};
const handleTelegramUpdate=async(update)=>{
    if(update.callback_query)return handleTelegramCallback(update.callback_query);
    const m=update.message;
    if(!m)return;
    const id=String(m.chat?.id||'');
    if(!isAllowedChat(id))return;
    const s=getSession(id);
    if(s.step==='creating')return;
    const command=m.forward_origin||m.forward_date?null:m.text?.trim();
    if(command==='/start')return say(id,'Перешлите фотографии и примечания в открытую папку.');
    if(command==='Инфо'||command==='/count'){
        if(s.step==='collect'||s.step==='edit'){s.step='collect';s.version=++sequence;return info(id,s);}
        return say(id,summary(s));
    }
    if(command==='+ Папка'||command==='Очистить'||command==='/cancel'){
        resetFlow(s);
        if(command==='+ Папка'){s.folders.push(emptyFolder());s.active=s.folders.length-1;return opened(id,s);}
        return say(id,'Что очистить?',[[btn(s,'Все','clear_all')],...folderRows(s,'clear'),[btn(s,'Отмена','back')]]);
    }
    if(command==='✈️'||command==='/order'||command==='Создать'){
        if(!total(s))return say(id,'Нет файлов для отправки.');
        resetFlow(s);s.step='preview';
        return say(id,summary(s),[[btn(s,'Продолжить','begin'),btn(s,'Отмена','back')]]);
    }
    if(s.step==='phone'&&m.text){
        const phone=normalizePhone(m.text);
        if(!phone)return say(id,'Введите корректный номер телефона:');
        const client=await User.findOne({where:{phone}});
        if(s.step!=='phone')return;
        Object.assign(s,{phone,clientId:client?.id||null,clientName:client?.FIO||(client?'Без имени':'Новый клиент'),step:'owner'});
        return say(id,`👤 ${escapeHTML(s.clientName)}\n📱 ${phone}\nЧей заказ?`,[[btn(s,'Клиент','client'),btn(s,'Нефедьев','nefediev')],[btn(s,'Отмена','back')]]);
    }
    const g=s.folders[s.active];
    if(s.step==='edit'&&m.text){g.notes=m.text.trim()==='-'?'':m.text.trim();s.step='collect';s.version=++sequence;return info(id,s);}
    if(m.document||m.photo){
        if(s.step!=='collect'&&s.step!=='edit')resetFlow(s);
        const file=m.document||m.photo[m.photo.length-1];
        const item={fileId:file.file_id,fileName:file.file_name||`telegram_${m.message_id}.jpg`,size:file.file_size,messageId:m.message_id};
        appendNote(g,m.caption);
        if(item.size>MAX_FILE_SIZE){g.skipped.push(item);return say(id,`⚠️ ${escapeHTML(item.fileName)} больше 20 МБ. Скачать вручную после создания заказа.`);}
        g.files.push(item);return;
    }
    if(m.text&&s.step==='collect')appendNote(g,m.text);
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
