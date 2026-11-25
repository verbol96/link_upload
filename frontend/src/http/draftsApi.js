
import { $host } from './index';

const BASE = 'api/my-files';

// Один и тот же объект File сохраняет идентификатор
// при повторной попытке загрузки.
const uploadIds = new WeakMap();

const createUploadId = () => {
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return crypto.randomUUID();
    }

    // Для локальной разработки через HTTP.
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = [...bytes]
        .map(value => value.toString(16).padStart(2, '0'))
        .join('');

    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20)
    ].join('-');
};

export const getDraft = async () =>
    (await $host.get(`${BASE}/draft`)).data;

export const createDraftFolder = async folder =>
    (await $host.post(`${BASE}/folders`, folder)).data;

export const updateDraftFolder = async (id, changes) =>
    (await $host.patch(`${BASE}/folders/${id}`, changes)).data;

export const deleteDraftFolder = async id =>
    (await $host.delete(`${BASE}/folders/${id}`)).data;

export const uploadDraftFile = async (
    folderId,
    file,
    onProgress,
    signal
) => {
    let uploadId = uploadIds.get(file);

    if (!uploadId) {
        uploadId = createUploadId();
        uploadIds.set(file, uploadId);
    }

    const formData = new FormData();
    formData.append('file', file);

    const { data } = await $host.post(
        `${BASE}/folders/${folderId}/files`,
        formData,
        {
            signal,
            headers: {
                'X-Upload-Id': uploadId
            },
            onUploadProgress: event => {
                if (!event.total || !onProgress) return;

                onProgress(
                    Math.min(
                        99,
                        Math.round(event.loaded / event.total * 100)
                    )
                );
            }
        }
    );

    onProgress?.(100);
    return data;
};

export const getDraftPreview = async (fileId, signal, size = 'small') =>
    (await $host.get(
        `${BASE}/files/${fileId}/preview`,
        {
            params: { size },
            responseType: 'blob',
            signal
        }
    )).data;

export const deleteDraftFile = async fileId =>
    (await $host.delete(`${BASE}/files/${fileId}`)).data;

export const submitDraft = async order =>
  (await $host.post(`${BASE}/submit`, order)).data;