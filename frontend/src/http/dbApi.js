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

export const addSettings = async(type, title, price) =>{
    const {data} = await $host.post( 'api/settings/add', {'type': type, 'title': title, 'price': price} )
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

export const deleteOrder = async(id) =>{
    const {res} = $host.delete(`api/order/deleteOrder/${id}`)
    return res
}
