const sendTelegramMessage=async(text)=>{
    try{
        const token=process.env.TELEGRAM_BOT_TOKEN;
        const chatId=process.env.TELEGRAM_CHAT_ID;

        if(!token||!chatId){
            console.error('Telegram: не указан TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID');
            return;
        }

        const response=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                chat_id:chatId,
                text,
                parse_mode:'HTML'
            })
        });

        if(!response.ok){
            const error=await response.text();
            console.error('Telegram error:',error);
        }
    }catch(error){
        console.error('Ошибка отправки Telegram:',error.message);
    }
};

module.exports={sendTelegramMessage};