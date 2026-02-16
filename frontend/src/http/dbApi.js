import {$host} from './index'
import _ from 'lodash'

export const getAll = async() =>{
    const {data} = await $host.get( 'api/order/getAll')
    return data.order
}

export const getOneUser = async(phone) =>{
    const {data} = await $host.post( 'api/order/getOneUser', {'phone': phone})
    return data
}

export const getSettings = async() =>{
    const {data} = await $host.get( 'api/settings/getAll')
    return _.orderBy(data, 'createdAt', 'asc')
}

export const updateSettings = async(title, value) =>{
    const {data} = await $host.put( 'api/settings/update', {'title': title, 'value': value} )
    return data
}

export const addSettings = async(type, title, name, price) =>{
    const {data} = await $host.post( 'api/settings/add', {'type': type, 'title': title, 'name': name, 'price': price} )
    return data
}


export const setCopyBD = async(file) =>{
    const {data} = await $host.post( 'api/settings/setCopyDB', {'file': file})
    console.log(data)
    return data
}

export const deleteSetting = async(id) =>{
    const {data} = await $host.delete( `api/settings/delete/${id}`)
    return data
}

export const updateOrder = async(id, data) =>{
    const {res} = $host.put(`api/order/updateOrder/${id}`, data)
    return res
}

export const updateUserAdress = async(id, data) =>{
    const {res} = $host.put(`api/order/updateUserAdress/${id}`, data)
    return res
}

export const deleteOrder = async(id) =>{
    const {res} = $host.delete(`api/order/deleteOrder/${id}`)
    return res
}

export const getCopyBD = async () => {
    const { data } = await $host.get('api/settings/getCopyBD')

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
   // Создаем объект Date
    let currentDate = new Date();

    // Получаем день, месяц и год
    let day = String(currentDate.getDate()).padStart(2, '0');
    let month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    let year = currentDate.getFullYear();

    // Форматируем дату
    let formattedDate = day + '.' + month + '.' + year;

    // Добавляем дату к названию файла
    link.setAttribute('download', 'backup_DB_' + formattedDate + '.json');

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};