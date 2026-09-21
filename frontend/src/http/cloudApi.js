import {$host} from './index'


export const getFiles = async(dirId)=>{
    const {data} = await $host.get(`/api/file/${dirId===null? '': `?parent=`+dirId}`)
    return data
}

export const getFilesPhotosId = async(id)=>{
    const {data} = await $host.post(`/api/file/getFilesPhotosId`, {id: id})
    return data 
}

export const getFilesAll = async()=>{
    const {data} = await $host.get(`/api/file/getFilesAll`)
    return data 
}

export const createDir = async(nameDir, parentId)=>{
    let obj
    (parentId===undefined)?obj={"name": nameDir, "type": 'dir'} : obj={"name": nameDir, type: 'dir', parent: parentId}
    const {data} = await $host.post('/api/file/',obj)
    return data
}

export const uploadFiles = async(file, parentFile, id)=>{
    const formDate = new FormData()
    formDate.append('id', id)
    formDate.append('file', file.file)
    formDate.append('fileName', file.file.name);
    formDate.append('parent', parentFile)
    const {data} = await $host.post('/api/file/upload', formDate)
    return data
}

export const deleteFile = async(id)=>{
    const {data} = await $host.delete(`/api/file?id=${id}`)
    return data
}

export const deleteFileAll = async()=>{
    const {data} = await $host.delete(`/api/file/all`)
    return data
}

export const downloadFiles = async (file, onProgress) => {
    // === ЛИМИТ ЗАДАЁТСЯ ЗДЕСЬ ===
    const MAX_PART_SIZE = 1500 * 1024 * 1024; // 1.5 ГБ в байтах

    // 1. Получаем список частей
    const { data: partsInfo } = await $host.get(
        `/api/file/download-parts/?id=${file.id}&maxSize=${MAX_PART_SIZE}`
    );

    const totalParts = partsInfo.totalParts;

    if (totalParts === 0) {
        throw new Error('Нет файлов для скачивания');
    }

    // 2. Если одна часть — качаем как раньше
    if (totalParts === 1) {
        const { data } = await $host.get(
            `/api/file/download/?id=${file.id}&part=1&maxSize=${MAX_PART_SIZE}`,
            {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(1, 1, percent);
                },
            }
        );

        const downloadUrl = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${file.name}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        return data;
    }

    // 3. Если несколько частей — качаем по очереди
    for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1;

        const { data } = await $host.get(
            `/api/file/download/?id=${file.id}&part=${partNumber}&maxSize=${MAX_PART_SIZE}`,
            {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(partNumber, totalParts, percent);
                },
            }
        );

        const downloadUrl = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${file.name}_part${partNumber}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        // Пауза между скачиваниями
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
};

export const displayFileImg = async (id) => {
  if (!id) return null;

  try {
    const response = await $host.get(`/api/file/thumb?id=${id}`, {
      responseType: 'blob'
    });

    // Если ответ пустой или статус не 200
    if (!response?.data || response.data.size === 0) {
      return null;
    }

    return window.URL.createObjectURL(response.data);

  } catch (error) {
    // 404 или любая другая ошибка — просто возвращаем null
    //console.warn(`Файл ${id} не загружен:`, error.response?.status || error.message);
    return null;
  }
}