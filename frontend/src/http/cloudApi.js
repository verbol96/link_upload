import {$host, API_URL} from './index'


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
                const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
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
    let totalParts = 1;

    try {
        const { data: partsInfo } = await $host.get(
            `/api/file/download-parts/`,
            { params: { id: file.id, maxSize: MAX_PART_SIZE } }
        );
        totalParts = Number(partsInfo.totalParts) || 0;
    } catch (err) {
        console.error('Ошибка получения download-parts:', err);
        throw new Error('Не удалось получить информацию о файле');
    }

    if (totalParts === 0) {
        throw new Error('Нет файлов для скачивания');
    }

    // 2. Качаем каждую часть по очереди
    for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1;
        let reported = false;

        const response = await fetchWithAuth(
            `${API_URL}/api/file/download/?id=${file.id}&part=${partNumber}&maxSize=${MAX_PART_SIZE}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            throw new Error(`Ошибка скачивания части ${partNumber}: HTTP ${response.status}`);
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

            if (reported) continue;

            if (contentLength > 0) {
                const percent = Math.round((received * 100) / contentLength);
                onProgress(partNumber, totalParts, percent);
            } else {
                const loadedMB = (received / 1024 / 1024).toFixed(1);
                onProgress(partNumber, totalParts, null, loadedMB);
            }
        }

        // Финальный 100%
        if (!reported) {
            onProgress(partNumber, totalParts, 100);
        }
        reported = true;

        if (onPartDone) onPartDone(partNumber, totalParts);

        // === Определяем имя файла из Content-Disposition ===
        const contentDisposition = response.headers.get('Content-Disposition') || '';
        let fileName = null;

        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i);

        if (utf8Match) {
            fileName = decodeURIComponent(utf8Match[1]);
        } else if (simpleMatch) {
            fileName = decodeURIComponent(simpleMatch[1]);
        }

        // Запасной вариант, если заголовка нет
        if (!fileName) {
            fileName = totalParts > 1
                ? `${file.name}_part${partNumber}.zip`
                : file.name;
        }

        // === Тип контента — из ответа (zip или оригинальный) ===
        const responseContentType =
            response.headers.get('Content-Type') || 'application/octet-stream';

        const blob = new Blob(chunks, { type: responseContentType });

        if (blob.size === 0) {
            throw new Error(`Часть ${partNumber} пришла пустой`);
        }

        // === Сохраняем ===
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
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