
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAdminDrafts,
  getAdminDraft,
  getAdminDraftPreview,
  deleteAdminDraft
} from '../../http/adminDraftsApi';

const Icon = ({ name, className = '' }) => (
  <i className={`bi ${name} ${className}`} />
);

const formatSize = bytes => {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} Б`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} КБ`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} МБ`;
  return `${(size / 1024 ** 3).toFixed(2)} ГБ`;
};

const dateText = value =>
  value ? new Date(value).toLocaleString('ru-RU') : '—';

const remainingText = value => {
  if (!value) return 'Не начат';
  const remaining = new Date(value).getTime() - Date.now();
  if (remaining <= 0) return 'Срок хранения истёк';
  const hours = Math.ceil(remaining / 3600000);
  return `${Math.floor(hours / 24)} дн. ${hours % 24} ч.`;
};

const folderName = folder =>
  folder.type === 'template'
    ? 'Фотополоски'
    : folder.name || folder.format;


const clientLabel = item => (item.FIO || item.phone || 'Клиент').trim().split(/\s+/)[0];

function FolderTile({ title, subtitle, onClick, onDelete, deleting = false, client = null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!menuOpen) return;
    const close = event => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const escape = event => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const reposition = () => setMenuOpen(false);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [menuOpen]);

  return (
    <div className="group relative aspect-square min-w-0 rounded-xl bg-white ring-1 ring-inset ring-[#7890A8] transition-colors hover:ring-[#647D97]">
      <div className="absolute inset-x-0 top-0 z-20 flex h-10 items-center gap-1 px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {client && <Icon name="bi-person-circle" className="shrink-0 text-[15px] text-[#7890A8]" />}
          <span className="truncate text-[12px] font-normal text-[#475569]" title={title}>
            {client ? clientLabel(client) : title}
          </span>
        </div>
        {client && (
          <div className="relative shrink-0" ref={menuRef}>
            <button type="button" ref={menuButtonRef} onClick={() => {
              if (!menuOpen && menuButtonRef.current) {
                const rect = menuButtonRef.current.getBoundingClientRect();
                const width = Math.min(256, window.innerWidth - 16);
                setMenuPosition({
                  top: rect.bottom + 6,
                  left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))
                });
              }
              setMenuOpen(value => !value);
            }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#7890A8] hover:bg-[#F3F5F7]"
              title="Информация о клиенте" aria-label="Информация о клиенте" aria-expanded={menuOpen}>
              <Icon name="bi-three-dots" className="text-[16px]" />
            </button>
            {menuOpen && (
              <div style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed z-[200] w-64 max-w-[calc(100vw-16px)] rounded-lg bg-white p-3 text-[12px] text-[#64748B] shadow-lg ring-1 ring-inset ring-[#E2E8F0]">
                <div className="break-words text-[#475569]">{client.FIO || 'Без ФИО'}</div>
                <div className="mt-2">{client.phone ? <a href={`tel:${client.phone}`} className="hover:text-[#274C77]">{client.phone}</a> : 'Телефон не указан'}</div>
                <div className="mt-2">Последняя загрузка: {dateText(client.lastUploadAt)}</div>
                <div className="mt-1">Осталось: {remainingText(client.expiresAt)}</div>
                <div className="mt-1">Файлов: {client.fileCount ?? 0}</div>
                <button type="button" disabled={deleting} onClick={() => { setMenuOpen(false); onDelete?.(); }}
                  className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-red-600 hover:bg-red-50 disabled:opacity-40">
                  <Icon name="bi-trash" /> Удалить черновик
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <button type="button" disabled={deleting} onClick={onClick}
        className="flex h-full w-full flex-col items-center justify-center px-3 pt-8 pb-10 disabled:opacity-40">
        <Icon name="bi-folder" className="text-[43px] text-[#7890A8]" />
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-2 pb-2">
        <div className="flex h-7 items-center justify-center truncate rounded-md bg-white px-2 text-[11px] font-normal text-[#475569] ring-1 ring-inset ring-[#7890A8]">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function PhotoTile({ item, onOpen }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = null;

    getAdminDraftPreview(item.id, controller.signal)
      .then(blob => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          console.error('Ошибка превью:', error);
        }
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.id]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group min-w-0 rounded-xl bg-white p-2 text-left ring-1 ring-inset ring-[#E2E8F0] transition-colors hover:ring-[#7890A8]"
    >
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-[#FAFBFD]">
        {url ? (
          <img
            src={url}
            alt={item.originalName}
            className="h-full w-full object-contain transition-transform duration-150 group-hover:scale-[1.02]"
          />
        ) : (
          <Icon
            name="bi-image"
            className="text-[25px] text-[#CBD5E1]"
          />
        )}
      </div>
      <div
        className="mt-1.5 truncate px-0.5 text-center text-[11px] font-normal text-[#475569]"
        title={item.originalName}
      >
        {item.originalName}
      </div>
    </button>
  );
}

function PhotoViewer({ item, onClose }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = null;

    getAdminDraftPreview(item.id, controller.signal, true)
      .then(blob => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });

    const onKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      controller.abort();
      window.removeEventListener('keydown', onKeyDown);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.id, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 text-white">
        <span className="truncate text-[13px]">
          {item.originalName}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/15"
          aria-label="Закрыть"
        >
          <Icon name="bi-x-lg" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        {url ? (
          <img
            src={url}
            alt={item.originalName}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-[13px] text-white/60">
            {error ? 'Не удалось открыть фотографию' : 'Загрузка…'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminDrafts({ onExit, onDraftsChanged }) {
  const [drafts, setDrafts] = useState([]);
  const [draft, setDraft] = useState(null);
  const [folderId, setFolderId] = useState(null);
  const [viewerItem, setViewerItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');

  const selectedFolder = draft?.folders.find(
    folder => folder.id === folderId
  );

  const totalBytes = draft
    ? (selectedFolder
        ? selectedFolder.items
        : draft.folders.flatMap(folder => folder.items))
        .reduce((sum, item) => sum + (Number(item.size) || 0), 0)
    : drafts.reduce(
        (sum, item) => sum + (Number(item.totalSize) || 0),
        0
      );

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDrafts(await getAdminDrafts());
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Не удалось загрузить черновики'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openDraft = async id => {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminDraft(id);
      setDraft(result);
      setFolderId(null);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Не удалось открыть черновик'
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    if (folderId) {
      setFolderId(null);
    } else if (draft) {
      setDraft(null);
      loadList();
    } else {
      onExit?.();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deletingId) return;

    const id = deleteTarget.id;
    setDeletingId(id);
    setError('');

    try {
      const result = await deleteAdminDraft(id);

      setDeleteTarget(null);
      setDrafts(previous =>
        previous.filter(item => item.id !== id)
      );

      if (result.filesRemoved === false) {
        console.warn(
          'Черновик удалён из базы, но его файлы требуют очистки на сервере'
        );
      }

      onDraftsChanged?.();
      await loadList();
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Не удалось удалить черновик'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-[60vh] flex-1 bg-[#FAFBFD] text-[#475569]">
      <main className="mx-auto w-[90%] min-w-0 pb-10">
        <div className="mt-4 flex min-h-[56px] items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm"
          style={{ border: "1.5px solid #bfcbd7" }}>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-[13px]">
            <button type="button" onClick={goBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#64748B] ring-1 ring-inset ring-[#E2E8F0] hover:bg-[#F3F5F7]" aria-label="Назад">
              <Icon name="bi-arrow-left" className="text-[17px]" />
            </button>
            <button type="button" onClick={onExit} className="shrink-0 text-[#64748B] hover:text-[#274C77]">Все файлы</button>
            <Icon name="bi-chevron-right" className="shrink-0 text-[10px] text-[#94A3B8]" />
            <button type="button" onClick={() => { setDraft(null); setFolderId(null); }}
              className={`${!draft ? 'text-[#475569]' : 'text-[#64748B] hover:text-[#274C77]'}`}>
              Черновики
            </button>
            {draft && (
              <>
                <Icon name="bi-chevron-right" className="shrink-0 text-[10px] text-[#94A3B8]" />
                <button type="button" onClick={() => setFolderId(null)}
                  className={`max-w-[150px] truncate ${!selectedFolder ? 'text-[#475569]' : 'text-[#64748B] hover:text-[#274C77]'}`}>
                  {clientLabel(draft)}
                </button>
              </>
            )}
            {selectedFolder && (
              <>
                <Icon name="bi-chevron-right" className="shrink-0 text-[10px] text-[#94A3B8]" />
                <span className="truncate text-[#475569]">{folderName(selectedFolder)}</span>
              </>
            )}
            {!draft && <span className="ml-2 shrink-0 text-[12px] text-[#94A3B8]">Клиентов: {drafts.length}</span>}
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[12px] text-[#64748B]" title="Размер открытого раздела">
            <Icon name="bi-hdd" className="text-[16px] text-[#7890A8]" />
            <span className="tabular-nums">{formatSize(totalBytes)}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-[13px] text-[#94A3B8]">
            Загрузка…
          </div>
        ) : !draft ? (
          drafts.length ? (
            <div className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {drafts.map(item => (
                <FolderTile
                  key={item.id}
                  title={item.FIO || item.phone || 'Клиент'}
                  subtitle={`${item.fileCount} файлов · ${formatSize(item.totalSize)}`}
                  client={item}
                  onClick={() => openDraft(item.id)}
                  onDelete={() => setDeleteTarget(item)}
                  deleting={deletingId === item.id}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-[13px] text-[#94A3B8]">
              Активных черновиков нет
            </div>
          )
        ) : !selectedFolder ? (
          draft.folders.length ? (
            <div className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {draft.folders.map(folder => (
                <FolderTile
                  key={folder.id}
                  title={folderName(folder)}
                  subtitle={`${folder.items.length} файлов · ${formatSize(folder.items.reduce((sum, item) => sum + (Number(item.size) || 0), 0))}`}
                  onClick={() => setFolderId(folder.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-[13px] text-[#94A3B8]">
              Папок пока нет
            </div>
          )
        ) : (
          <>
            {selectedFolder.note && (
              <div className="mt-4 rounded-lg bg-white px-4 py-3 text-[12px] text-[#64748B] ring-1 ring-inset ring-[#E2E8F0]">
                <span className="font-medium text-[#334155]">
                  Примечание:
                </span>{' '}
                {selectedFolder.note}
              </div>
            )}
            {selectedFolder.items.length ? (
              <div className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {selectedFolder.items.map(item => (
                  <PhotoTile
                    key={item.id}
                    item={item}
                    onOpen={() => setViewerItem(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-[13px] text-[#94A3B8]">
                В папке пока нет фотографий
              </div>
            )}
          </>
        )}
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-draft-title"
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center gap-2 text-red-600">
              <Icon name="bi-trash" className="text-[18px]" />
              <h3
                id="delete-draft-title"
                className="text-[15px] font-semibold"
              >
                Удалить черновик?
              </h3>
            </div>
            <p className="mt-3 text-[13px] leading-5 text-stone-600">
              Черновик клиента{' '}
              <strong>
                {deleteTarget.FIO || deleteTarget.phone || 'Без имени'}
              </strong>{' '}
              и все загруженные фотографии будут удалены без возможности восстановления.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={!!deletingId}
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-[13px] text-stone-600 hover:bg-stone-50 disabled:opacity-40"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={!!deletingId}
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-40"
              >
                {deletingId ? 'Удаление…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewerItem && (
        <PhotoViewer
          item={viewerItem}
          onClose={() => setViewerItem(null)}
        />
      )}
    </div>
  );
}
