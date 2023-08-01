import {$host} from './index'

export const SendToDB = async(file)=>{
    
    const {data} = await $host.post('api/order/addOrder', file)
    return data
    
}