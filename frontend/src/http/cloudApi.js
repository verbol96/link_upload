import { changeProgress } from '../store/fileReducer'
import {$host} from './index'


export const getFiles = async(dirId)=>{
    const {data} = await $host.get(`/api/file/${dirId===null? '': `?parent=`+dirId}`)
    return data
}

export const createDir = async(nameDir, parentId)=>{
    let obj
    (parentId===undefined)?obj={"name": nameDir, "type": 'dir'} : obj={"name": nameDir, type: 'dir', parent: parentId}
    const {data} = await $host.post('/api/file/',obj)
    return data
}

export const uploadFiles = async(file, parentFile, dispatch)=>{
    const formDate = new FormData()
    formDate.append('file', file)
    formDate.append('parent', parentFile)
    const {data} = await $host.post('/api/file/upload', formDate, {
        onUploadProgress: progressEvent => {
            const totalLength = progressEvent.event.lengthComputable ? progressEvent.total : progressEvent.event.target.getResponseHeader('content-length') || progressEvent.event.target.getResponseHeader('x-decompressed-content-length');
            //console.log('total', totalLength)
            if (totalLength) {
                let progress = Math.round((progressEvent.loaded * 100) / totalLength)
                dispatch(changeProgress(progress))
            }
        }
    })
    return data
}

export const deleteFile = async(file)=>{
    const {data} = await $host.delete(`/api/file?id=${file.id}`)
    return data
}

export const downloadFiles = async(file)=>{
    
    const {data} = await $host.get(`/api/file/download/?id=${file.id}`, {responseType:'blob'})
        const downloadUrl = window.URL.createObjectURL(data)
        const link = document.createElement('a')
        link.href = downloadUrl
        if(file.type==='dir'){
            link.download = `${file.name}.zip`
        }else{
            link.download = file.name
        }
        document.body.appendChild(link)
        link.click()
        link.remove()
    return data
}



