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

export const downloadFiles = async (file, onProgress, onPartDone) => {
    // === ЛИМИТ НА ЧАСТЬ АРХИВА ===
    const MAX_PART_SIZE = 1500 * 1024 * 1024; // 1.5 ГБ

    // Базовый URL для fetch
    const BASE_URL = `http://${window.location.hostname}:8002`;
    // Для сервера: 'https://link1.by:8002'

    const getToken = () => localStorage.getItem('token');

    // Обёртка fetch с авторизацией и refresh при 401
    const fetchWithAuth = async (url, options = {}) => {
        const makeRequest = async () => {
            const token = getToken();
            const headers = { ...options.headers };
            if (token) headers.Authorization = `Bearer ${token}`;
            return fetch(url, {
                ...options,
                headers,
                credentials: 'include',
            });
        };

        let response = await makeRequest();

        if (response.status === 401) {
            try {
                const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
                    method: 'GET',
                    credentials: 'include',
                });
                const refreshData = await refreshRes.json();
                if (refreshData === 'error_refresh') {
                    localStorage.removeItem('token');
                } else {
                    localStorage.setItem('token', refreshData.accessToken);
                    response = await makeRequest();
                }
            } catch (e) {
                localStorage.removeItem('token');
                console.log('НЕ АВТОРИЗОВАН по refresh');
            }
        }

        return response;
    };

    // 1. Получаем список частей
    const { data: partsInfo } = await $host.get(
        `/api/file/download-parts/?id=${file.id}&maxSize=${MAX_PART_SIZE}`
    );

    const totalParts = partsInfo.totalParts;
    if (totalParts === 0) throw new Error('Нет файлов для скачивания');

    // 2. Качаем каждую часть по очереди
    for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1;
        let partDone = false;

        const response = await fetchWithAuth(
            `${BASE_URL}/api/file/download/?id=${file.id}&part=${partNumber}&maxSize=${MAX_PART_SIZE}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            throw new Error(`Ошибка скачивания части ${partNumber}: ${response.status}`);
        }

        const contentLength = Number(response.headers.get('Content-Length')) || 0;
        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            received += value.length;

            if (partDone) continue;

            if (contentLength > 0) {
                const percent = Math.round((received * 100) / contentLength);
                onProgress(partNumber, totalParts, percent);
            } else {
                const loadedMB = (received / 1024 / 1024).toFixed(1);
                onProgress(partNumber, totalParts, null, loadedMB);
            }
        }

        // Финальный 100%
        if (!partDone) {
            onProgress(partNumber, totalParts, 100);
        }
        partDone = true;

        if (onPartDone) onPartDone(partNumber, totalParts);

        const blob = new Blob(chunks, { type: 'application/zip' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = totalParts > 1
            ? `${file.name}_part${partNumber}.zip`
            : `${file.name}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        if (partNumber < totalParts) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
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