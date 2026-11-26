
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavBar } from '../components/admin/NavBar';
import { ContactForm } from '../components/web/ContactForm';
import { useSelector } from 'react-redux';
import { getSettings } from '../http/dbApi';
import {
  getDraft,
  createDraftFolder,
  updateDraftFolder,
  deleteDraftFolder,
  uploadDraftFile,
  getDraftPreview,
  deleteDraftFile,
  submitDraft
} from '../http/draftsApi';
import { PageAfterUpload } from '../components/web/PageAfterUpload';
import { v4 as uuidv4 } from 'uuid';

const TYPES = [
  { value: 'photo', label: 'Фотографии' },
  { value: 'holst', label: 'Холсты' },
  { value: 'magnit', label: 'Магниты' },
  { value: 'poster', label: 'Постеры' }
];

const PAPER_TYPES = [
  {
    value: 'glossy',
    label: 'Глянец',
    description: 'Гладкая блестящая поверхность с насыщенными цветами.'
  },
  {
    value: 'lustre',
    label: 'Люстр',
    description: 'Полуматовая текстурированная поверхность с меньшим количеством бликов.'
  }
];

const MAX_PARALLEL = 4;

const Icon = ({ name, className = '' }) => (
  <i className={`bi ${name} ${className}`} aria-hidden="true" />
);

const errorText = error =>
  error?.response?.data?.message ||
  error?.message ||
  'Произошла ошибка';

const priceNumber = value => {
  if (value == null || String(value).trim() === '') return null;
  const number = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const money = value => `${value.toFixed(2).replace('.', ',')} р`;

const normalize = value =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[×х]/g, 'x')
    .replace(/\s+/g, '');

const folderName = folder =>
  folder.type === 'template'
    ? 'Фотополоски'
    : folder.name || folder.format;

const folderTypeLabel = folder => {
  const names = {
    photo: 'Фото',
    holst: 'Холст',
    canvas: 'Холст',
    magnit: 'Магнит',
    magnet: 'Магнит',
    poster: 'Постер',
    template: 'Фото'
  };
  return names[String(folder?.type || '').toLowerCase()] || 'Другое';
};

const formatSize = bytes => {
  const value = Number(bytes);
  if (!Number.isFinite(value)) return '—';
  return value >= 1048576
    ? `${(value / 1048576).toFixed(1)} МБ`
    : `${Math.round(value / 1024)} КБ`;
};

const storageTime = (expiresAt, now) => {
  if (!expiresAt) return null;
  const remaining = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(remaining)) return null;
  if (remaining <= 0) return 'Срок хранения истёк';
  const hours = Math.ceil(remaining / 3600000);
  return `${Math.floor(hours / 24)} дн. ${hours % 24} ч.`;
};

const findSetting = (folder, settings) => {
  if (folder.type === 'template') {
    return (
      settings.find(
        item =>
          item.type === 'photo' &&
          String(item.title || '').trim() === '<a6'
      ) ||
      settings.find(
        item =>
          item.type === 'photo' &&
          normalize(item.name).includes('другойдо10x15')
      )
    );
  }

  return (
    settings.find(
      item =>
        String(item.id) === String(folder.settingId) &&
        item.type === folder.type
    ) ||
    settings.find(
      item =>
        item.type === folder.type &&
        (
          item.title === folder.format ||
          item.name === folder.format ||
          normalize(item.name) === normalize(folder.format)
        )
    )
  );
};

const folderTotal = (folder, settings) => {
  const price = priceNumber(findSetting(folder, settings)?.price);
  return price === null
    ? null
    : Math.round(price * (folder.items?.length || 0) * 100) / 100;
};


const toolbarAddButton =
  'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border bg-white px-3.5 text-[#475569] transition-colors hover:bg-[#F7F9FA] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4';

function FolderIcon() {
  return (
    <svg viewBox="0 0 120 100" className="h-full w-full" aria-hidden="true">
      <path
        d="M12 28 Q12 19 21 19 H47 L57 29 H99 Q108 29 108 38 V78 Q108 87 99 87 H21 Q12 87 12 78Z"
        fill="#B0C1D2"
        stroke="#9DAFC1"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M12 46 Q12 39 20 39 H100 Q108 39 108 47 V79 Q108 87 100 87 H20 Q12 87 12 79Z"
        fill="#D7E1EB"
        stroke="#9DAFC1"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderModal({ folder, settings, busy, onClose, onSave }) {
  const initialSetting = folder ? findSetting(folder, settings) : null;

  const [type, setType] = useState(
    folder?.type || initialSetting?.type || 'photo'
  );

  const [settingId, setSettingId] = useState(
    String(
      initialSetting?.id ??
      settings.find(item => item.type === (folder?.type || 'photo'))?.id ??
      ''
    )
  );

  const [paperType, setPaperType] = useState(
    folder?.paperType || 'glossy'
  );

  const [note, setNote] = useState(folder?.note || '');

  const availableSettings = settings.filter(
    item => item.type === type
  );

  const selected = availableSettings.find(
    item => String(item.id) === String(settingId)
  );

  const canChoosePaper = type === 'photo' || type === 'magnit';

  useEffect(() => {
    const handler = event => {
      if (event.key === 'Escape' && !busy) onClose();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [busy, onClose]);

  const submit = event => {
    event.preventDefault();
    if (!selected || busy) return;

    onSave({
      type,
      settingId: selected.id,
      paperType: canChoosePaper ? paperType : null,
      note: note.trim()
    });
  };

  const fieldClass =
    'h-10 w-full rounded-lg border border-[#DDE2E8] bg-white px-3 text-[13px] text-[#334155] outline-none transition-colors focus:border-[#274C77] focus:ring-1 focus:ring-[#274C77]/10';

  const labelClass =
    'mb-1.5 block text-[12px] font-medium text-[#475569]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-3"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-[400px] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        {/* Заголовок */}
        <div className="flex items-center bg-[#274C77] justify-between px-4 py-3">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
            {folder ? (
                <>
                    <i className="bi bi-gear" />
                    Настройки папки
                </>
            ) : (
                <>
                    <i className="bi bi-folder-plus" />
                    Создание папки
                </>
            )}
        </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Закрыть"
            className="flex h-7 w-7 items-center justify-center rounded-md text-white transition-colors disabled:opacity-40"
          >
            <Icon name="bi-x-lg" className="text-[13px]" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-5">
          {/* Тип продукции */}
          <div>
            <label htmlFor="folder-type" className={labelClass}>
              Тип продукции
            </label>

            <select
              id="folder-type"
              value={type}
              disabled={!!folder}
              onChange={event => {
                const nextType = event.target.value;
                const firstSetting = settings.find(
                  item => item.type === nextType
                );

                setType(nextType);
                setSettingId(String(firstSetting?.id ?? ''));
              }}
              className={`${fieldClass} disabled:bg-[#F8F9FA] disabled:text-[#94A3B8]`}
            >
              {TYPES.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Размер */}
          <div>
            <label htmlFor="folder-format" className={labelClass}>
              Формат
            </label>

            <select
              id="folder-format"
              required
              value={selected ? settingId : ''}
              onChange={event => setSettingId(event.target.value)}
              className={fieldClass}
            >
              {!availableSettings.length && (
                <option value="">Нет доступных размеров</option>
              )}

              {availableSettings.map(item => {
                const price = priceNumber(item.price);

                return (
                  <option key={item.id} value={String(item.id)}>
                    {item.name || item.title} —{' '}
                    {price === null
                      ? 'Цена не указана'
                      : money(price)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Тип фотобумаги */}
          {canChoosePaper && (
            <div>
              <div className={labelClass}>
                Тип фотобумаги
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#F3F5F7] p-1">
                {PAPER_TYPES.map(paper => {
                  const active = paperType === paper.value;

                  return (
                    <button
                      key={paper.value}
                      type="button"
                      onClick={() => setPaperType(paper.value)}
                      aria-pressed={active}
                      className={`flex h-9 items-center justify-center gap-2 rounded-md text-[13px] font-medium transition-all ${
                        active
                          ? 'bg-white text-[#334155] shadow-sm'
                          : 'text-[#94A3B8] hover:text-[#475569]'
                      }`}
                    >
                      {active && (
                        <Icon
                          name="bi-check2"
                          className="text-[15px]"
                        />
                      )}
                      {paper.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Примечание */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="folder-note"
                className="text-[12px] font-medium text-[#475569]"
              >
                Примечание
              </label>

              <span className="text-[11px] text-[#94A3B8]">
                Необязательно
              </span>
            </div>

            <textarea
              id="folder-note"
              rows={2}
              maxLength={2000}
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="Пожелания к печати..."
              className="block min-h-[72px] w-full resize-y rounded-lg border border-[#DDE2E8] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#334155] outline-none placeholder:text-[#A0AAB8] focus:border-[#274C77] focus:ring-1 focus:ring-[#274C77]/10"
            />
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex items-center justify-end gap-2 border-t border-[#EDF0F2] px-4 py-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-[13px] font-medium text-[#64748B] transition-colors hover:bg-[#F1F3F6] disabled:opacity-40"
          >
            Отмена
          </button>

          <button
            type="submit"
            disabled={busy || !selected}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#274C77] bg-[#274C77] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1E3A5D] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy
              ? 'Сохранение…'
              : folder
                ? 'Сохранить'
                : 'Создать папку'}
          </button>
        </div>
      </form>
    </div>
  );
}


function FolderCard({
  folder,
  settings,
  busy,
  onOpen,
  onEdit,
  onDelete
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const total = folderTotal(folder, settings);

  useEffect(() => {
    if (!menuOpen) return;

    const close = event => {
      if (
        event.key === 'Escape' ||
        (
          event.type === 'pointerdown' &&
          !menuRef.current?.contains(event.target)
        )
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);

    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

  return (
    <div className="group relative min-w-0 rounded-xl bg-white p-2 transition-colors hover:bg-[#F8FAFC] sm:p-2.5">
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen(folder.id)}
          className="block w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#274C77]"
          aria-label={`Открыть папку ${folderName(folder)}`}
        >
          <div className="mx-auto flex aspect-[1.25] w-full items-center justify-center">
            <div className="h-[78px] w-[94px] transition-transform duration-150 group-hover:scale-[1.03] sm:h-[86px] sm:w-[103px]">
              <FolderIcon />
            </div>
          </div>
        </button>

        <div ref={menuRef} className="absolute right-0 top-0 z-20">
          <button
            type="button"
            onClick={() => setMenuOpen(value => !value)}
            disabled={busy}
            aria-label="Действия с папкой"
            className="flex h-6 w-6 items-center justify-center rounded-full text-[#94A3B8] hover:bg-white hover:text-[#475569]"
          >
            <Icon name="bi-three-dots" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-7 z-30 w-44 rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-lg">
              {folder.type !== 'template' && (
                <button
                  type="button"

                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(folder);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-xs text-[#475569] hover:bg-[#F1F3F6]"
                >
                  <Icon name="bi-pencil" />
                  Настройки
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(folder);
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-xs text-red-600 hover:bg-red-50"
              >
                <Icon name="bi-trash3" />
                Удалить папку
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(folder.id)}
        className="mt-0.5 block w-full min-w-0 text-center"
      >
        <div
          className="line-clamp-2 break-words text-[12px] font-medium leading-tight text-[#252B35] sm:text-[13px]"
          title={folderName(folder)}
        >
          {folderName(folder)}
        </div>

        <div className="mt-1 text-[10px] text-[#94A3B8]">
          {folderTypeLabel(folder)}
        </div>

        <div className="mt-0.5 flex flex-wrap items-center justify-center gap-x-1 text-[10px] text-[#94A3B8]">
          <span>{folder.items?.length || 0} шт.</span>
          <span>·</span>
          <span>{total === null ? '—' : money(total)}</span>
        </div>
      </button>
    </div>
  );
}

function SavedPhoto({ item, onOpen, onDelete, isTemplate }) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  const [removing, setRemoving] = useState(false);
  const name = String(item.originalName ?? '').normalize('NFC');

  useEffect(() => {
    let active = true;
    let url = '';
    const controller = new AbortController();

    getDraftPreview(item.id, controller.signal)
      .then(blob => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(error => {
        if (active && error?.code !== 'ERR_CANCELED') {
          setFailed(true);
        }
      });

    return () => {
      active = false;
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [item.id]);

  const remove = async () => {
    if (!window.confirm(`Удалить «${name}»?`)) return;
    setRemoving(true);

    try {
      await onDelete(item.id);
    } catch {
      // Ошибка отображается на странице.
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="group relative min-w-0 rounded-lg p-1.5 hover:bg-white/70 sm:p-2">
      <div className="relative aspect-square overflow-hidden rounded-md bg-[#E9ECEF]">
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="flex h-full w-full items-center justify-center"
          title="Открыть фотографию"
        >
          {src ? (
            <img
              src={src}
              alt={name}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-[#94A3B8]">
              <Icon name="bi-image" className="text-xl" />
              <span className="text-[10px]">
                {failed ? 'Нет превью' : 'Загрузка…'}
              </span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={remove}
          disabled={removing}
          aria-label={`Удалить ${name}`}
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#64748B] shadow-sm hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Icon
            name={removing ? 'bi-hourglass-split' : 'bi-x'}
            className="text-lg"
          />
        </button>
      </div>

      {!isTemplate && (
        <div className="mt-1.5 min-w-0 text-center">
          <div
            className="truncate text-[10px] font-medium text-[#475569] sm:text-[11px]"
            title={name}
          >
            {name}
          </div>
          <div className="mt-0.5 text-[10px] text-[#94A3B8]">
            {formatSize(item.size)}
          </div>
        </div>
      )}
    </div>
  );
}

function PendingPhoto({ task, onRetry, onRemove }) {
  const isError = task.status === 'error';
  const isQueued = task.status === 'queued';

  return (
    <div className="relative min-w-0 rounded-lg p-1.5 sm:p-2">
      <div className="relative aspect-square overflow-hidden rounded-md bg-[#E9ECEF]">
        <img
          src={task.url}
          alt={task.file.name}
          className="h-full w-full object-contain opacity-60"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/20">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] text-[#475569] shadow-sm">
            {isError
              ? 'Ошибка'
              : isQueued
                ? 'В очереди'
                : task.progress >= 99
                  ? 'Обработка…'
                  : `${task.progress}%`}
          </span>

          {isError && (
            <button
              type="button"
              onClick={() => onRetry(task.id)}
              className="rounded-full bg-[#274C77] px-3 py-1.5 text-xs text-white"
            >
              Повторить
            </button>
          )}
        </div>

        {!isError && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-[#E2E8F0]">
            <div
              className="h-full bg-[#274C77]"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        )}

        {(isQueued || isError) && (
          <button
            type="button"
            onClick={() => onRemove(task.id)}
            aria-label="Убрать из очереди"
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#64748B]"
          >
            <Icon name="bi-x" className="text-lg" />
          </button>
        )}
      </div>

      <div className="mt-1.5 min-w-0 text-center">
        <div className="truncate text-[10px] font-medium text-[#475569]">
          {task.file.name}
        </div>
        <div className="mt-0.5 text-[10px] text-[#94A3B8]">
          {formatSize(task.file.size)}
        </div>
      </div>
    </div>
  );
}

function PhotoViewer({ item, onClose }) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let url = '';
    const controller = new AbortController();

    getDraftPreview(item.id, controller.signal, 'large')
      .then(blob => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [item.id]);

  useEffect(() => {
    const handler = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"

      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {item.originalName}
          </div>
          <div className="text-xs text-white/60">
            {formatSize(item.size)}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <Icon name="bi-x-lg" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        {src ? (
          <img
            src={src}
            alt={item.originalName}
            onClick={event => event.stopPropagation()}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-sm text-white/60">
            {failed
              ? 'Не удалось открыть фотографию'
              : 'Загрузка…'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function MyFiles() {
  const profile = useSelector(state => state.private.user);
  const [checkout, setCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
const [completedOrder, setCompletedOrder] = useState(null);
const submittingRef = useRef(false);
  const [FIO, setFIO] = useState('');
  const [phone, setPhone] = useState('');
  const [typePost, setTypePost] = useState('E');
  const [city, setCity] = useState('');
  const [adress, setAdress] = useState('');
  const [oblast, setOblast] = useState('');
  const [postCode, setPostCode] = useState('');
  const [other, setOther] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [draft, setDraft] = useState(null);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [now] = useState(() => Date.now());

  const tasksRef = useRef([]);
  const activeRef = useRef(0);
  const mountedRef = useRef(true);
  const fileInputRef = useRef(null);
  const selectedIdRef = useRef(null);
  const pumpRef = useRef(null);

  const setTaskList = useCallback(update => {
    const next =
      typeof update === 'function'
        ? update(tasksRef.current)
        : update;

    tasksRef.current = next;
    if (mountedRef.current) setTasks(next);
  }, []);

  const loadDraft = useCallback(async () => {
    const data = await getDraft();
    if (!mountedRef.current) return;

    setDraft(data);
    setSelectedId(current =>
      data.folders.some(
        folder => String(folder.id) === String(current)
      )
        ? current
        : null
    );
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    getSettings()
      .then(data => {
        if (mountedRef.current) setSettings(data);
      })
      .catch(() => {
        if (mountedRef.current) {
          setError('Не удалось загрузить прайс-лист');
        }
      });

    loadDraft()
      .then(() => {
        const folder = new URLSearchParams(
          window.location.search
        ).get('folder');

        if (folder) setSelectedId(folder);
      })
      .catch(error => {
        if (mountedRef.current) setError(errorText(error));
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });

    return () => {
      mountedRef.current = false;
      tasksRef.current.forEach(task =>
        URL.revokeObjectURL(task.url)
      );
    };
  }, [loadDraft]);

  useEffect(() => {
    if (!profile || typeof profile !== 'object') return;
    setFIO(profile.FIO ?? '');
    setPhone(profile.phone ?? '');
    setTypePost(profile.typePost ?? 'E');
    setCity(profile.city ?? '');
    setAdress(profile.adress ?? '');
    setOblast(profile.oblast ?? '');
    setPostCode(profile.postCode ?? '');
  }, [profile]);

  const selectedFolder =
    draft?.folders.find(
      folder => String(folder.id) === String(selectedId)
    ) || null;

  selectedIdRef.current = selectedFolder?.id ?? selectedId;

  const hasActiveUploads = folderId =>
    tasksRef.current.some(
      task =>
        String(task.folderId) === String(folderId) &&
        task.status === 'uploading'
    );

  const clearFolderTasks = folderId => {
    const removable = tasksRef.current.filter(
      task =>
        String(task.folderId) === String(folderId) &&
        task.status !== 'uploading'
    );

    removable.forEach(task => URL.revokeObjectURL(task.url));

    setTaskList(previous =>
      previous.filter(
        task =>
          String(task.folderId) !== String(folderId) ||
          task.status === 'uploading'
      )
    );
  };

  const pump = useCallback(() => {
    while (activeRef.current < MAX_PARALLEL) {
      const next = tasksRef.current.find(
        task => task.status === 'queued'
      );
      if (!next) break;

      activeRef.current += 1;

      setTaskList(previous =>
        previous.map(task =>
          task.id === next.id
            ? { ...task, status: 'uploading', progress: 0 }
            : task
        )
      );

      uploadDraftFile(
        next.folderId,
        next.file,
        progress => {
          setTaskList(previous =>
            previous.map(task =>
              task.id === next.id
                ? { ...task, progress }
                : task
            )
          );
        }
      )
        .then(item => {
          setTaskList(previous =>
            previous.filter(task => task.id !== next.id)
          );
          URL.revokeObjectURL(next.url);

          if (!mountedRef.current) return;

          setDraft(previous =>
            previous
              ? {
                  ...previous,
                  startedAt:
                    previous.startedAt ||
                    new Date().toISOString(),
                  folders: previous.folders.map(folder =>
                    String(folder.id) === String(next.folderId)
                      ? {
                          ...folder,
                          items: [
                            ...folder.items.filter(
                              existing => existing.id !== item.id
                            ),
                            item
                          ]
                        }
                      : folder
                  )
                }
              : previous
          );

          getDraft()
            .then(data => {
              if (!mountedRef.current) return;

              setDraft(previous => ({
                ...data,
                folders: data.folders.map(folder => {
                  const oldFolder = previous?.folders.find(
                    old =>
                      String(old.id) === String(folder.id)
                  );

                  if (!oldFolder) return folder;

                  const ids = new Set(
                    folder.items.map(item => item.id)
                  );

                  return {
                    ...folder,
                    items: [
                      ...folder.items,
                      ...oldFolder.items.filter(
                        item => !ids.has(item.id)
                      )
                    ]
                  };
                })
              }));
            })
            .catch(() => {});
        })
        .catch(error => {
          setTaskList(previous =>
            previous.map(task =>
              task.id === next.id
                ? {
                    ...task,
                    status: 'error',
                    error: errorText(error)
                  }
                : task
            )
          );
        })
        .finally(() => {
          activeRef.current -= 1;
          pumpRef.current?.();
        });
    }
  }, [setTaskList]);

  pumpRef.current = pump;

  const addFiles = event => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    const folderId = selectedIdRef.current;
    if (!folderId || !files.length) return;

    const accepted = files.filter(
      file =>

        file.type.startsWith('image/') ||
        /\.(heic|heif|tif|tiff)$/i.test(file.name)
    );

    if (accepted.length !== files.length) {
      setError(
        'Некоторые файлы пропущены: поддерживаются только изображения.'
      );
    }

    const newTasks = accepted.map(file => ({
      id: uuidv4(),
      folderId,
      file,
      url: URL.createObjectURL(file),
      status: 'queued',
      progress: 0
    }));

    setTaskList(previous => [...previous, ...newTasks]);
    pump();
  };

  const retryTask = id => {
    setTaskList(previous =>
      previous.map(task =>
        task.id === id
          ? { ...task, status: 'queued', progress: 0 }
          : task
      )
    );
    pump();
  };

  const removeTask = id => {
    const task = tasksRef.current.find(
      task => task.id === id
    );
    if (!task || task.status === 'uploading') return;

    URL.revokeObjectURL(task.url);

    setTaskList(previous =>
      previous.filter(task => task.id !== id)
    );
  };

  const saveFolder = async values => {
    setBusy(true);
    setError('');

    try {
      if (modal?.type === 'edit') {
        await updateDraftFolder(modal.folder.id, {
          settingId: values.settingId,
          note: values.note,
          paperType: values.paperType
        });

        await loadDraft();
      } else {
        const setting = settings.find(
          item =>
            String(item.id) === String(values.settingId)
        );

        const folder = await createDraftFolder({
          type: values.type,
          name: setting?.name || setting?.title,
          format: setting?.title || setting?.name,
          settingId: values.settingId,
          note: values.note,
          paperType: values.paperType
        });

        setDraft(previous => ({
          ...previous,
          folders: [
            ...previous.folders,
            { ...folder, items: [] }
          ]
        }));

      }

      setModal(null);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const removeFolder = async folder => {
    if (hasActiveUploads(folder.id)) {
      setError(
        'Дождитесь завершения загрузки файлов в этой папке.'
      );
      return;
    }

    const count = folder.items.length;
    const message = count
      ? `Удалить папку «${folderName(folder)}» и все файлы (${count} шт.)?`
      : `Удалить папку «${folderName(folder)}»?`;

    if (!window.confirm(message)) return;

    setBusy(true);
    setError('');

    try {
      await deleteDraftFolder(folder.id);
      clearFolderTasks(folder.id);

      setDraft(previous => ({
        ...previous,
        folders: previous.folders.filter(
          item => String(item.id) !== String(folder.id)
        )
      }));

      if (String(selectedId) === String(folder.id)) {
        setSelectedId(null);
      }
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const removeFile = async id => {
    try {
      await deleteDraftFile(id);

      setDraft(previous => ({
        ...previous,
        folders: previous.folders.map(folder => ({
          ...folder,
          items: folder.items.filter(
            item => item.id !== id
          )
        }))
      }));
    } catch (error) {
      setError(errorText(error));
      throw error;
    }
  };


  const folderTasks = tasks.filter(
    task => String(task.folderId) === String(selectedId)
  );

  const pendingCount = tasks.filter(
    task =>
      task.status === 'queued' ||
      task.status === 'uploading'
  ).length;

  const failedCount = tasks.filter(
    task => task.status === 'error'
  ).length;

  const totalPrice =
    draft?.folders.reduce(
      (sum, folder) =>
        sum + (folderTotal(folder, settings) || 0),
      0
    ) || 0;

  const fileCount = draft?.folders.reduce(
    (sum, folder) => sum + (folder.items?.length || 0), 0
  ) || 0;

  const canvasCount = draft?.folders.reduce(
    (sum, folder) =>
      sum + (folder.type === 'holst' ? folder.items?.length || 0 : 0),
    0
  ) || 0;

  const isHolst = () => canvasCount > 0;

  const tariff = title =>
    priceNumber(settings.find(item => item.title === title)?.price) ?? 0;

  const calcDelivery = value => {
    if (!fileCount) return '0.00';

    const weight = fileCount + 250 * canvasCount;
    const amount = totalPrice;

    switch (value) {
      case 'E1':
        return (
          tariff('E') + (weight >= 300 ? 0.9 : 0)
        ).toFixed(2);

      case 'E':
        return (
          tariff('E') +
          (weight >= 300 ? 0.9 : 0) +
          amount * 0.015 +
          Math.max(amount * 0.015, 0.3)
        ).toFixed(2);

      case 'R1':
      case 'R2': {
        if (isHolst()) {
          const mass = fileCount * 3 + canvasCount * 700;

          return (
            tariff('R') +
            Math.max((mass - 1000) / 100, 0) * 0.09 +
            (mass > 1000 ? 1 : 0)
          ).toFixed(2);
        }

        return (
          tariff('R1') +
          0.48 * Math.max(0, Math.ceil((fileCount - 30) / 30))
        ).toFixed(2);
      }

      case 'R':
        return (
          tariff('R') +
          amount * 0.03 +
          Math.max(amount * (amount > 200 ? 0.02 : 0.03), 1)
        ).toFixed(2);

      default:
        return '0.00';
    }
  };

  const deliveryPrice = Number(calcDelivery(typePost));
  const savedDeliveryPrice = typePost === 'R1' ? deliveryPrice : 0;

  const openCheckout = () => {
    if (!fileCount || pendingCount || failedCount) return;

    setSelectedId(null);
    setError('');
    setCheckout(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

const validateCheckout = async () => {
  if (submittingRef.current) return;

  const normalizedPhone = `+${phone.replace(/\D/g, '')}`;
  const validPhone = /^\+375(?:25|29|33|44)\d{7}$/.test(normalizedPhone);
  const post = ['R', 'R1', 'R2'].includes(typePost);

  setIsValid(!validPhone);

  if (
    !FIO.trim() ||
    !validPhone ||
    !city.trim() ||
    !adress.trim() ||
    (post && (!/^\d{6}$/.test(postCode.trim()) || !oblast))
  ) {
    setError(
      'Заполните ФИО, корректный телефон и все необходимые поля доставки.'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (!fileCount || pendingCount || failedCount) {
    setError('Дождитесь завершения загрузки всех фотографий.');
    return;
  }

  submittingRef.current = true;
  setSubmitting(true);
  setError('');

  try {
    const result = await submitDraft({
      FIO: FIO.trim(),
      phone: normalizedPhone,
      typePost,
      city: city.trim(),
      adress: adress.trim(),
      oblast,
      postCode: postCode.trim(),
      other,
      price: totalPrice.toFixed(2),
      price_deliver: savedDeliveryPrice.toFixed(2)
    });

    setCompletedOrder(result);
    setCheckout(false);
    setDraft(null);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    setError(errorText(error));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    submittingRef.current = false;
    setSubmitting(false);
  }
};

  const goBack = () => {
    setSelectedId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-[#252B35]">
      <NavBar />

      <div className="flex min-h-[calc(100vh-70px)] flex-col">
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-5 sm:px-6 lg:px-8">
          {error && (
            <div
              role="alert"
              className="mt-4 mb-4 flex items-start justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                aria-label="Закрыть ошибку"
              >
                <Icon name="bi-x-lg" />
              </button>
            </div>
          )}

{completedOrder ? (
  <PageAfterUpload
    amountPhoto={completedOrder.fileCount ?? fileCount}
    phone={phone}
  />
) : loading ? (
            <div className="py-20 text-center text-sm text-[#94A3B8]">
              Загрузка…
            </div>
          ) : !draft ? (
            <div className="py-20 text-center text-sm text-[#64748B]">
              Не удалось загрузить файлы.
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  loadDraft()
                    .catch(error =>
                      setError(errorText(error))
                    )
                    .finally(() =>
                      setLoading(false)
                    );
                }}
                className="ml-2 text-[#274C77] underline"
              >
                Повторить
              </button>
            </div>
          ) : checkout ? (

  <div className="mx-auto w-full max-w-6xl py-5">
    <button
      type="button"
      onClick={() => {
        setCheckout(false);
        setError('');
      }}
      className="mb-4 inline-flex items-center gap-2 text-[13px] text-[#64748B] hover:text-[#274C77]"
    >
      <Icon name="bi-arrow-left" />
      Назад к фотографиям
    </button>

    <div className="flex flex-col gap-6 md:gap-10 pt-4">
      {/* Информация о заказе */}
<section className="relative rounded-xl border border-slate-200/80 bg-white shadow-md">
  <div className="absolute left-3 top-0 flex -translate-y-1/2 items-center gap-2 md:left-6">
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#274C77] text-xs font-semibold text-white md:h-8 md:w-8">
      1
    </span>
    <span className="flex h-7 items-center rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 text-[12px] font-semibold text-[#334155] md:h-8 md:text-[13.5px]">
      Информация о заказе
    </span>
  </div>

  <div className="space-y-3 p-4 pt-8 text-[13px] text-slate-700 md:p-6 md:pt-9">
    {draft.folders.map(folder => {
      const total = folderTotal(folder, settings);
      const count = folder.items?.length || 0;

      return (
        <div key={folder.id} className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <i className="bi bi-folder-fill shrink-0 text-[24px] text-[#B0C1D2]" />

            <div className="min-w-0">
              <div className="font-medium text-[#334155]">
                {folder.type === 'template'
                  ? 'Фотополоски'
                  : folderTypeLabel(folder)}
              </div>

              <div className="mt-0.5 text-[12px] text-slate-500">
                {findSetting(folder, settings)?.name || folder.format}
                {' · '}
                {count} шт.
              </div>
            </div>
          </div>

          <span className="shrink-0 whitespace-nowrap font-medium">
            {total === null ? '—' : money(total)}
          </span>
        </div>
      );
    })}

    <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
      <div>
        <div className="text-base font-semibold">Итого</div>
        <div className="text-[11px] text-slate-400">
          Всего файлов: {fileCount}
        </div>
      </div>

      <span className="text-base font-semibold text-[#274C77]">
        {money(totalPrice)}
      </span>
    </div>
  </div>
</section>

      {/* Данные для отправки */}
      <section className="relative rounded-xl border border-slate-200/80 bg-white shadow-md">
        <div className="absolute left-3 top-0 flex -translate-y-1/2 items-center gap-2 md:left-6">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#274C77] text-xs font-semibold text-white md:h-8 md:w-8">
            2
          </span>
          <span className="flex h-7 items-center rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 text-[12px] font-semibold text-[#334155] md:h-8 md:text-[13.5px]">
            Данные для отправки
          </span>
        </div>

        <div className="p-3 pt-8 md:p-5 md:pt-9">
          <ContactForm
            FIO={FIO}
            setFIO={setFIO}
            phone={phone}
            setPhone={setPhone}
            typePost={typePost}
            setTypePost={setTypePost}
            city={city}
            setCity={setCity}
            adress={adress}
            setAdress={setAdress}
            postCode={postCode}
            setPostCode={setPostCode}
            oblast={oblast}
            setOblast={setOblast}
            other={other}
            setOther={setOther}
            isValid={isValid}
            isHolst={isHolst}
            calcDelivery={calcDelivery}
          />
        </div>
      </section>

      {/* Кнопка отправки вне блоков */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={validateCheckout}
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#274C77] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#1E3A5D] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          {submitting ? (
            <>
              <Icon name="bi-arrow-repeat" className="animate-spin" />
              Оформляем заказ…
            </>
          ) : (
            <>
              <Icon name="bi-check2-circle" />
              Отправить заказ
              <Icon name="bi-arrow-right" />
            </>
          )}
        </button>
      </div>
    </div>
  </div>
          ) : (
            <>
            {selectedFolder || draft.folders.length !== 0 ?
            (
             <div className="mb-2 mt-4 rounded-xl bg-white px-3 py-2 shadow-sm sm:px-4"
                style={{ border: "1.5px solid #bfcbd7" }}>
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <nav
                    aria-label="Путь к файлам"
                    className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                      {selectedFolder ? (
                        <button
                          type="button"
                          onClick={goBack}
                          aria-label="Назад ко всем папкам"
                          title="Назад"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F3F6]"
                        >
                          <Icon
                            name="bi-chevron-left"
                            className="text-[19px]"
                          />
                        </button>
                      ) : (
                        <Icon
                          name="bi-collection"
                          className="text-[19px] text-[#64748B]"
                        />
                      )}
                    </div>

                    <div className="hidden min-w-0 items-center gap-2 sm:flex">
                      {selectedFolder ? (
                        <>
                          <button
                            type="button"
                            onClick={goBack}
                            className="shrink-0 text-[13px] font-normal text-[#64748B] hover:text-[#274C77]"
                          >
                            Все папки
                          </button>
                          <Icon
                            name="bi-chevron-right"
                            className="shrink-0 text-[11px] text-[#94A3B8]"
                          />
                          <span
                            className="min-w-0 truncate text-[13px] font-medium text-[#334155]"
                            title={folderName(selectedFolder)}
                          >
                            {folderName(selectedFolder)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[13px] font-medium text-[#334155]">
                          Все папки
                        </span>
                      )}
                    </div>

                    <span
                      className="min-w-0 flex-1 truncate text-center text-[14px] font-medium text-[#334155] sm:hidden"
                      title={
                        selectedFolder
                          ? folderName(selectedFolder)
                          : 'Все папки'
                      }
                    >
                      {selectedFolder
                        ? folderName(selectedFolder)
                        : 'Все папки'}
                    </span>
                  </nav>

                  <div className="flex shrink-0 items-center gap-2 ">
                    {selectedFolder ? (
                      <>
                        {selectedFolder.type !== 'template' && (
                          <button
                            type="button"
                            onClick={() =>
                              fileInputRef.current?.click()
                            }
                            disabled={busy}
                            title="Добавить фото"
                            aria-label="Добавить фото"
                            className={toolbarAddButton}
                            style={{ borderColor: '#CBD5E1' }}
                          >
                            <Icon
                              name="bi-plus-lg"
                              className="text-[17px]"
                            />
                            <span className="hidden text-[13px] font-medium sm:inline">
                              Добавить фото
                            </span>
                          </button>
                        )}

                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setModal({ type: 'create' })
                        }
                        disabled={busy || !settings.length}
                        title="Добавить папку"
                        aria-label="Добавить папку"
                        className={toolbarAddButton}
                        style={{ borderColor: '#CBD5E1' }}
                      >
                        <Icon
                          name="bi-folder-plus"
                          className="text-[17px]"
                        />
                        <span className="hidden text-[13px] font-medium sm:inline">
                          Добавить папку
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>)
            :
            ''}

             

              {selectedFolder && (
                <div className="mb-3 px-2 text-[11px] font-normal text-[#94A3B8]">
                  {folderTypeLabel(selectedFolder)} ·{' '}
                  {selectedFolder.items.length + folderTasks.length} файлов
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif,.tif,.tiff"
                multiple
                className="hidden"
                onChange={addFiles}
              />

              {!selectedFolder && draft.folders.length === 0 ? (
                <div className="flex flex-col items-center mt-4 px-2 pt-3 pb-6 sm:pt-4">
                  <div className="w-full max-w-[460px] rounded-xl border border-[#E2E5E9] bg-white px-4 py-6 text-center">
                    <h2 className="mt-3 text-[20px] font-semibold leading-snug text-[#334155] sm:text-[23px]">
                      Подготовьте фотографии к печати
                    </h2>

                    <p className="mt-3 text-[13px] leading-relaxed text-[#64748B] sm:text-[14px]">
                      Загружайте фотографии заранее, а отправляйте заказ,
                      когда всё будет готово.
                    </p>

                    <div className="mt-6 space-y-4 text-left">
                      <div className="flex items-start gap-4">
                        <Icon
                          name="bi-cloud-arrow-up"
                          className="mt-0.5 shrink-0 text-[22px] text-[#64748B]"
                        />
                        <div>
                          <h3 className="text-[14px] font-medium text-[#334155]">
                            Загружайте постепенно
                          </h3>
                          <p className="mt-1 text-[13px] leading-relaxed text-[#64748B]">
                            Добавляйте фотографии в течение нескольких дней —
                            файлы сохраняются автоматически.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <Icon
                          name="bi-phone"
                          className="mt-0.5 shrink-0 text-[22px] text-[#64748B]"
                        />
                        <div>
                          <h3 className="text-[14px] font-medium text-[#334155]">
                            Продолжайте с любого устройства
                          </h3>
                          <p className="mt-1 text-[13px] leading-relaxed text-[#64748B]">
                            Начните с телефона, продолжите с компьютера.
                            Файлы доступны в личном кабинете.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <Icon
                          name="bi-folder2"
                          className="mt-0.5 shrink-0 text-[22px] text-[#64748B]"
                        />
                        <div>
                          <h3 className="text-[14px] font-medium text-[#334155]">
                            Организуйте фотографии по папкам
                          </h3>
                          <p className="mt-1 text-[13px] leading-relaxed text-[#64748B]">
                            Выбирайте форматы, добавляйте файлы и проверяйте
                            стоимость перед заказом.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModal({ type: 'create' })}
                      disabled={busy || !settings.length}
                      className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg  bg-[#274C77] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#1E3A5D] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Icon
                        name="bi-folder-plus"
                        className="text-[19px]"
                      />
                      Создать папку
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-x-2 gap-y-4 mt-4 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
                  {!selectedFolder ? (
                    draft.folders.map(folder => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        settings={settings}
                        busy={busy}
                        onOpen={id => {
                          setSelectedId(id);
                          setError('');
                        }}
                        onEdit={folder =>
                          setModal({
                            type: 'edit',
                            folder
                          })
                        }
                        onDelete={removeFolder}
                      />
                    ))
                  ) : (
                    <>
                      {selectedFolder.items.map(item => (
                        <SavedPhoto
                          key={item.id}
                          item={item}
                          onOpen={setPreviewItem}
                          onDelete={removeFile}
                          isTemplate={
                            selectedFolder.type === 'template'
                          }
                        />
                      ))}

                      {folderTasks.map(task => (
                        <PendingPhoto
                          key={task.id}
                          task={task}
                          onRetry={retryTask}
                          onRemove={removeTask}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}

              {selectedFolder &&
                selectedFolder.items.length === 0 &&
                folderTasks.length === 0 && (
                  <div className="py-14 text-center text-sm text-[#94A3B8]">
                    В папке пока нет файлов
                  </div>
                )}

              {selectedFolder?.type === 'template' && (
                <p className="mt-8 text-center text-xs text-[#94A3B8]">
                  Фотополоски добавляются автоматически из редактора.
                </p>
              )}

              {!selectedFolder && draft.folders.length > 0 && (
                <div className="mt-auto pt-6">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm"
                    style={{ border: "1.5px solid #bfcbd7" }}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Icon
                        name="bi-receipt"
                        className="text-xl text-[#64748B]"
                      />
                      <span className="whitespace-nowrap text-lg font-semibold text-[#252B35]">
                        {money(totalPrice)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={openCheckout}
                      disabled={!fileCount || pendingCount > 0 || failedCount > 0}
                      title={!fileCount ? 'Добавьте фотографии' : pendingCount || failedCount ? 'Дождитесь загрузки всех файлов' : 'Перейти к оформлению'}
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#274C77] px-3.5 text-[13px] font-medium text-white hover:bg-[#1E3A5D] transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:text-sm"
                    >
                      К оформлению
                      <Icon name="bi-arrow-right" />
                    </button>
                  </div>

                  {draft.expiresAt &&
                    storageTime(draft.expiresAt, now) && (
                      <div className="mt-2 flex items-center gap-1.5 pl-4 text-[11px] text-[#94A3B8]">
                        <Icon name="bi-clock-history" />
                        <span>
                          Хранение:{' '}
                          {storageTime(draft.expiresAt, now)}
                        </span>
                      </div>
                    )}

                  {(pendingCount > 0 || failedCount > 0) && (
                    <div className="mt-2 pl-4 text-xs text-[#64748B]">
                      {pendingCount > 0
                        ? `Загружается: ${pendingCount}`
                        : `Ошибок загрузки: ${failedCount}`}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {modal && (
        <FolderModal
          key={
            modal.type === 'edit'
              ? modal.folder.id
              : 'create'
          }
          folder={
            modal.type === 'edit'
              ? modal.folder
              : null
          }
          settings={settings}
          busy={busy}
          onClose={() => setModal(null)}
          onSave={saveFolder}
        />
      )}

      {previewItem && (
        <PhotoViewer
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}
