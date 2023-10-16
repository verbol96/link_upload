import {$host} from './index'
import jwt_decode from "jwt-decode"

export const registration = async(login, password)=>{
    const {data} = await $host.post('http://localhost:8000/api/auth/registration', {login, password, role: 'ADMIN'})
    localStorage.getItem('token', data)
    return jwt_decode(data)
}

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
    localStorage.removeItem('token')
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
