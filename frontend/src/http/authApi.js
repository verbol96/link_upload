import {$host} from './index'
import jwt_decode from "jwt-decode"



export const login = async(phone, password)=>{
    const {data} = await $host.post('/api/auth/login', {phone, password})
    localStorage.setItem('token', data.accessToken)
    return data
}

export const refresh = async()=>{
    const {data} = await $host.get('/api/auth/refresh')
    localStorage.setItem('token', data.accessToken)
    return data
}

export const logout = async()=>{
    localStorage.clear();
    await $host.get('/api/auth/logout')
}

export const getUsers = async()=>{
    const {data} = await $host.get('/api/auth/getUsers')
    return data
}

export const passwordChange = async(oldPW, newPW)=>{
    const {data} = await $host.put('/api/auth/passwordChange', {oldPW, newPW})
    return data
}

export const dataChange = async(phone, FIO)=>{
    const {data} = await $host.put('/api/auth/dataChange', {phone, FIO})
    return data
}

export const whoAmI = async()=>{
    const {data} = await $host.get('/api/auth/whoAmI')
    return data
}

export const changePasswordUser = async(phone, password)=>{
    const {data} = await $host.put('/api/auth/changePasswordUser', {phone, password})
    return data
}

export const sendSms = async(phone, code)=>{
    const {data} = await $host.post('/api/auth/sendSms', {phone, code})
    return data
}




export const users_changeData = async(id, phone, FIO, city, role)=>{
    
    const {data} = await $host.put('/api/auth/users_changeData', {id, phone, FIO, city, role})
    return data
}
export const users_delete = async(id)=>{
    console.log(id)
    const {data} = await $host.delete(`/api/auth/usersDelete/${id}`);
    return data
}

export const users_changePW = async(id, PW)=>{
    const {data} = await $host.put('/api/auth/users_changePW', {id, PW})
    return data
}
export const deleteUsersWithoutOrders = async()=>{
    const {data} = await $host.get('/api/auth/deleteUsersWithoutOrders')
    return data
}