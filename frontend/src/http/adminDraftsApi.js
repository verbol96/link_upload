
import { $host } from './index';

export const getAdminDrafts = async () => {
  const { data } = await $host.get('api/my-files/admin/drafts');
  return data;
};

export const getAdminDraft = async id => {
  const { data } = await $host.get(
    `api/my-files/admin/drafts/${encodeURIComponent(id)}`
  );
  return data;
};

export const getAdminDraftPreview = async (id, signal, large = false) => {
  const { data } = await $host.get(
    `api/my-files/admin/files/${encodeURIComponent(id)}/preview`,
    {
      params: large ? { size: 'large' } : {},
      responseType: 'blob',
      signal
    }
  );
  return data;
};

export const deleteAdminDraft = async id => {
  const { data } = await $host.delete(
    `api/my-files/admin/drafts/${encodeURIComponent(id)}`
  );
  return data;
};
