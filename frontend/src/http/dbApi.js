import {$host} from './index'
import _ from 'lodash'

export const getAll = async() =>{
    const {data} = await $host.get( 'api/order/getAll')
    return data.order
}

export const getSettings = async() =>{
    const {data} = await $host.get( 'api/settings/getAll')
    return _.orderBy(data, 'createdAt', 'asc')
}

export const updateSettings = async(title, value) =>{
    const {data} = await $host.put( 'api/settings/update', {'title': title, 'value': value} )
    return data
}
