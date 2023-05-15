import {$host} from './index'


export const getFiles = async(dirId)=>{
    const {data} = await $host.get(`/api/file/${dirId===null? '': `?parent=`+dirId}`)
    return data
}

export const createFiles = async(dirId, name)=>{
    //console.log(dirId)
    let obj
    (dirId===null)?obj={"name": name, "type": 'dir'} : obj={"name": name, type: 'dir', parent: dirId}
    const {data} = await $host.post('/api/file/',obj)
    return data
}

export const uploadFiles = async(file, dirId)=>{
    
    const formDate = new FormData()
    formDate.append('file', file)
    
    if(dirId){
        formDate.append('parent', dirId)
    }
    //console.log(formDate)
    const {data} = await $host.post('/api/file/upload', formDate)
   
    return data
}

export const deleteFile = async(file)=>{
    
    const {data} = await $host.delete(`/api/file?id=${file.id}`)
    //console.log(data)
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



