import {$host} from './index'
import UAParser from 'ua-parser-js';

export const login = async(phone, password)=>{
    const {data} = await $host.post('api/auth/login', {phone, password})
    localStorage.setItem('token', data.accessToken)
    return data
}

export const refresh = async()=>{
    const {data} = await $host.get('api/auth/refresh')
    localStorage.setItem('token', data.accessToken)
    return data
}

export const logout = async()=>{
    localStorage.clear();
    await $host.get('api/auth/logout')
}

export const getUsers = async()=>{
    const {data} = await $host.get('api/auth/getUsers')
    return data
}

export const passwordChange = async(oldPW, newPW)=>{
    const {data} = await $host.put('api/auth/passwordChange', {oldPW, newPW})
    return data
}

export const dataChange = async(phone, FIO)=>{
    const {data} = await $host.put('api/auth/dataChange', {phone, FIO})
    return data
}

export const whoAmI = async()=>{
    const {data} = await $host.get('api/auth/whoAmI')
    return data
}

export const changePasswordUser = async(phone, password)=>{
    const {data} = await $host.put('api/auth/changePasswordUser', {phone, password})
    return data
}

export const sendSms = async(phone, code)=>{
    const {data} = await $host.post('api/auth/sendSms', {phone, code})
    return data
}


export const users_changeData = async(id, phone, FIO, typePost, city, adress, postCode, raion, oblast, role)=>{
    
    const {data} = await $host.put('api/auth/users_changeData', {id, phone, FIO, typePost, city, adress, postCode, raion, oblast, role})
    return data
}
export const users_delete = async(id)=>{
    console.log(id)
    const {data} = await $host.delete(`api/auth/usersDelete/${id}`);
    return data
}

export const users_changePW = async(id, PW)=>{
    const {data} = await $host.put('api/auth/users_changePW', {id, PW})
    return data
}
export const deleteUsersWithoutOrders = async()=>{
    const {data} = await $host.get('api/auth/deleteUsersWithoutOrders')
    return data
}

const getLogSessionId=()=>{
    let sessionId=localStorage.getItem('logVisitorId');

    if(!sessionId){
        sessionId=sessionStorage.getItem('logSessionId');

        if(!sessionId){
            if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'){
                sessionId=crypto.randomUUID();
            }else{
                sessionId='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,(c)=>{
                    const r=Math.random()*16|0;
                    const v=c==='x'?r:((r&0x3)|0x8);
                    return v.toString(16);
                });
            }
        }

        localStorage.setItem('logVisitorId',sessionId);
    }

    sessionStorage.removeItem('logSessionId');

    return sessionId;
};

export const setLogUserData=(user)=>{
    if(!user){
        sessionStorage.removeItem('logUserPhone');
        sessionStorage.removeItem('logUserSurname');
        return;
    }

    const surname=user.FIO?.trim().split(/\s+/)[0]||null;

    sessionStorage.setItem('logUserPhone',user.phone||'0');

    if(surname){
        sessionStorage.setItem('logUserSurname',surname);
    }else{
        sessionStorage.removeItem('logUserSurname');
    }
};

const LOG_QUEUE_KEY = 'link_pending_logs';

let isSendingLogs = false;

const getPendingLogs = () => {
    try {
        return JSON.parse(localStorage.getItem(LOG_QUEUE_KEY) || '[]');
    } catch {
        return [];
    }
};

const savePendingLogs = logs => {
    localStorage.setItem(LOG_QUEUE_KEY, JSON.stringify(logs));
};

export const flushPendingLogs = async () => {
    if (isSendingLogs || !navigator.onLine) return;

    isSendingLogs = true;

    try {
        while (navigator.onLine) {
            const logs = getPendingLogs();

            if (!logs.length) break;

            const log = logs[0];

            await $host.post('api/auth/setLogUser', {
                dataLog: log.dataLog
            });

            savePendingLogs(
                getPendingLogs().filter(item => item.id !== log.id)
            );
        }
    } catch (error) {
        console.warn('Отправка логов отложена:', error.message);
    } finally {
        isSendingLogs = false;
    }
};

export const setLogUser = async (eventData = {}) => {
    try {
        let browserName = 'unknown';
        let browserVersion = 'unknown';
        let osName = 'unknown';
        let osVersion = 'unknown';
        let deviceModel = 'unknown';

        try {
            const parser = new UAParser();
            const result = parser.getResult();

            browserName = result.browser?.name || 'unknown';
            browserVersion = result.browser?.version || 'unknown';
            osName = result.os?.name || 'unknown';
            osVersion = result.os?.version || 'unknown';
            deviceModel = result.device?.model
                || result.device?.type
                || 'unknown';
        } catch (uaError) {
            console.warn('UA Parser error:', uaError.message);
        }

        const screenWidth = window.screen?.width || 0;
        const screenHeight = window.screen?.height || 0;

        const dataLog = {
            phone: eventData.phone || sessionStorage.getItem('logUserPhone') || '0',
            surname: eventData.surname || sessionStorage.getItem('logUserSurname') || null,
            sessionId: getLogSessionId(),
            event: eventData.event || 'visit',
            eventType: eventData.eventType || 'info',
            page: eventData.page || window.location.pathname,
            orderId: eventData.orderId ?? null,
            photosCount: eventData.photosCount ?? null,
            format: eventData.format ?? null,
            error: eventData.error ?? null,
            appVersion: eventData.appVersion ?? null,
            device: deviceModel,
            browser: `${browserName} (${browserVersion})`,
            OS: `${osName} (${osVersion})`,
            screen: `${screenWidth}x${screenHeight}`,
            createdAt: new Date().toISOString()
        };

        const logs = getPendingLogs();

        logs.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            dataLog
        });

        savePendingLogs(logs);

        await flushPendingLogs();

    } catch (error) {
        console.error('setLogUser error:', error.message);
    }
};

// Восстановление интернет-соединения
window.addEventListener('online', flushPendingLogs);

// Повторное открытие сайта
flushPendingLogs();

// Повторная попытка каждые 30 секунд
setInterval(flushPendingLogs, 30000);

export const deleteOldLogs=async()=>{
    const data=await $host.delete('api/auth/deleteOldLogs');
    return data;
};

export const deleteLogSession=async(sessionId)=>{
    const{data}=await $host.delete(`api/auth/deleteLogSession/${sessionId}`);
    return data;
};

export const deleteAllLogs=async()=>{
    const{data}=await $host.delete('api/auth/deleteAllLogs');
    return data;
};

export const getLogUser=async()=>{
    const {data}=await $host.get('api/auth/getLogUser');
    return data;
};