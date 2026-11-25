
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { execFile } = require('child_process');
const { promisify } = require('util');
const sequelize = require('../db');
const { Op } = require('sequelize');
const {
  MyFileDraft,
  MyFileFolder,
  MyFileItem,
  Settings
} = require('../models/models');

const execFileAsync = promisify(execFile);

const DAY = 24 * 60 * 60 * 1000;
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const CONVERSION_TIMEOUT = 120000;
const JPEG_QUALITY = 95;
const TYPES = ['photo', 'holst', 'magnit', 'poster', 'template'];
const PAPER_TYPES = ['glossy', 'lustre'];
const PAPER_PRODUCTS = ['photo', 'magnit'];

const EXTENSIONS = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.avif': 'image/avif'
};

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const storageRoot = () => {
  const root = process.env.FILEPATH_drafts;
  if (!root || !path.isAbsolute(root)) {
    throw new Error('Не настроен абсолютный путь FILEPATH_drafts');
  }
  return root;
};

const originalsDir = draftId =>
  path.join(storageRoot(), draftId, 'originals');

const originalPath = (draftId, storedName) => {
  if (!storedName || path.basename(storedName) !== storedName) {
    fail(404, 'Файл не найден');
  }
  return path.join(originalsDir(draftId), storedName);
};

const isExpired = draft =>
  Boolean(draft.expiresAt && new Date(draft.expiresAt) <= new Date());

const activeDraft = async userId => {
  const draft = await MyFileDraft.findOne({
    where: { userId, status: 'active' },
    order: [['createdAt', 'DESC']]
  });

  if (draft && isExpired(draft)) {
    await draft.update({ status: 'expired' });
    return null;
  }

  return draft;
};

const getOrCreateDraft = async userId => {
  let draft = await activeDraft(userId);
  if (!draft) draft = await MyFileDraft.create({ userId });
  return draft;
};

const ownedFolder = async (userId, folderId) => {
  const folder = await MyFileFolder.findOne({
    where: { id: folderId },
    include: [{
      model: MyFileDraft,
      required: true,
      where: { userId, status: 'active' }
    }]
  });

  if (!folder) fail(404, 'Папка не найдена');

  if (isExpired(folder.myFileDraft)) {
    fail(410, 'Срок хранения черновика истёк');
  }

  return folder;
};

const ownedItem = async (userId, itemId) => {
  const item = await MyFileItem.findOne({
    where: { id: itemId },
    include: [{
      model: MyFileFolder,
      required: true,
      include: [{
        model: MyFileDraft,
        required: true,
        where: { userId, status: 'active' }
      }]
    }]
  });

  if (!item) fail(404, 'Фотография не найдена');

  const draft = item.myFileFolder.myFileDraft;

  if (isExpired(draft)) {
    fail(410, 'Срок хранения черновика истёк');
  }

  return { item, draft };
};

const publicItem = item => ({
  id: item.id,
  folderId: item.folderId,
  originalName: item.originalName,
  size: item.size,
  mimeType: item.mimeType,
  uploadStatus: item.uploadStatus,
  position: item.position,
  previewUrl: `/api/my-files/files/${item.id}/preview`
});

const validNote = note =>
  typeof note === 'string' && note.length <= 2000;

const validatePaperType = (type, paperType) => {
  if (!PAPER_PRODUCTS.includes(type)) {
    if (paperType != null) {
      fail(400, 'Тип фотобумаги недоступен для этого товара');
    }
    return null;
  }

  const value = paperType == null ? 'glossy' : paperType;

  if (!PAPER_TYPES.includes(value)) {
    fail(400, 'Некорректный тип фотобумаги');
  }

  return value;
};

const getSetting = async (settingId, type) => {
  if (
    typeof settingId !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test(settingId)
  ) {
    fail(400, 'Выбери формат из прайс-листа');
  }

  const setting = await Settings.findByPk(settingId);

  if (!setting || setting.type !== type) {
    fail(400, 'Выбранный формат отсутствует в прайс-листе');
  }

  return setting;
};

exports.getDraft = async userId => {
  const draft = await getOrCreateDraft(userId);

  const folders = await MyFileFolder.findAll({
    where: { draftId: draft.id },
    include: [{ model: MyFileItem }],
    order: [['position', 'ASC'], ['createdAt', 'ASC']]
  });

  return {
    id: draft.id,
    status: draft.status,
    startedAt: draft.startedAt,
    expiresAt: draft.expiresAt,
    folders: folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      type: folder.type,
      format: folder.format,
      settingId: folder.settingId,
      paperType: folder.paperType ?? null,
      note: folder.note || '',
      position: folder.position,
      items: folder.myFileItems
        .sort((a, b) => a.position - b.position)
        .map(publicItem)
    }))
  };
};

exports.createFolder = async (userId, data = {}) => {
  const {
    name,
    format,
    type = 'photo',
    settingId,
    paperType,
    note = ''
  } = data;

  if (!TYPES.includes(type)) {
    fail(400, 'Некорректный тип папки');
  }

  if (!validNote(note)) {
    fail(400, 'Примечание не должно превышать 2000 символов');
  }

  if (type === 'template') {
    if (name !== 'Фотополоски' || format !== '5,4×15,2') {
      fail(400, 'Неизвестный шаблон');
    }

    const draft = await getOrCreateDraft(userId);

    const existing = await MyFileFolder.findOne({
      where: {
        draftId: draft.id,
        type: 'template',
        name
      }
    });

    if (existing) return existing;

    const maxPosition = await MyFileFolder.max('position', {
      where: { draftId: draft.id }
    });

    return MyFileFolder.create({
      draftId: draft.id,
      name,
      format,
      type,
      note: note.trim(),
      cropMode: null,
      paperType: null,
      position: Number.isFinite(maxPosition)
        ? maxPosition + 1
        : 0
    });
  }

  const setting = await getSetting(settingId, type);
  const validatedPaperType = validatePaperType(type, paperType);
  const title = setting.title;

  if (
    name !== undefined &&
    (
      typeof name !== 'string' ||
      !name.trim() ||
      name.length > 100
    )
  ) {
    fail(400, 'Некорректное название папки');
  }

  const draft = await getOrCreateDraft(userId);

  const maxPosition = await MyFileFolder.max('position', {
    where: { draftId: draft.id }
  });

  return MyFileFolder.create({
    draftId: draft.id,
    name: name?.trim() || title,
    format: title,
    type,
    settingId: setting.id,
    note: note.trim(),
    cropMode: null,
    paperType: validatedPaperType,
    position: Number.isFinite(maxPosition)
      ? maxPosition + 1
      : 0
  });
};

exports.updateFolder = async (userId, folderId, data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    fail(400, 'Некорректные данные папки');
  }

  const {
    name,
    position,
    settingId,
    note,
    paperType
  } = data;

  if (
    [name, position, settingId, note, paperType]
      .every(value => value === undefined)
  ) {
    fail(400, 'Нет данных для изменения');
  }

  if (
    name !== undefined &&
    (
      typeof name !== 'string' ||
      !name.trim() ||
      name.length > 100
    )
  ) {
    fail(400, 'Некорректное название папки');
  }

  if (
    position !== undefined &&
    (!Number.isInteger(position) || position < 0)
  ) {
    fail(400, 'Некорректная позиция');
  }

  if (note !== undefined && !validNote(note)) {
    fail(400, 'Примечание не должно превышать 2000 символов');
  }

  return sequelize.transaction(async transaction => {
    const folderInfo = await ownedFolder(userId, folderId);

    const draft = await MyFileDraft.findOne({
      where: {
        id: folderInfo.draftId,
        userId,
        status: 'active'
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!draft) fail(404, 'Черновик не найден');

    if (isExpired(draft)) {
      fail(410, 'Срок хранения черновика истёк');
    }

    const folder = await MyFileFolder.findOne({
      where: { id: folderId, draftId: draft.id },
      transaction
    });

    if (!folder) fail(404, 'Папка не найдена');

    if (
      folder.type === 'template' &&
      (settingId !== undefined || paperType != null)
    ) {
      fail(400, 'Настройки фотополосок нельзя изменить');
    }

    let formatChanged = false;

    if (settingId !== undefined) {
      const setting = await getSetting(settingId, folder.type);
      const nextFormat = setting.title;

      formatChanged =
        folder.format !== nextFormat ||
        folder.settingId !== setting.id;

      folder.settingId = setting.id;
      folder.format = nextFormat;

      if (
        name === undefined &&
        folder.name === folderInfo.format
      ) {
        folder.name = nextFormat;
      }
    }

    if (name !== undefined) folder.name = name.trim();
    if (position !== undefined) folder.position = position;
    if (note !== undefined) folder.note = note.trim();

    if (paperType !== undefined) {
      folder.paperType = validatePaperType(
        folder.type,
        paperType
      );
    }

    await folder.save({ transaction });

    if (formatChanged) {
      await MyFileItem.update(
        {
          cropData: null,
          cropConfirmed: false
        },
        {
          where: { folderId: folder.id },
          transaction
        }
      );
    }

    return folder;
  });
};

exports.deleteFolder = async (userId, folderId) => {
  const folderInfo = await ownedFolder(userId, folderId);

  const result = await sequelize.transaction(async transaction => {
    const draft = await MyFileDraft.findOne({
      where: {
        id: folderInfo.draftId,
        userId,
        status: 'active'
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!draft) fail(404, 'Черновик не найден');

    if (isExpired(draft)) {
      fail(410, 'Срок хранения черновика истёк');
    }

    const folder = await MyFileFolder.findOne({
      where: {
        id: folderId,
        draftId: draft.id
      },
      transaction
    });

    if (!folder) fail(404, 'Папка не найдена');

    const items = await MyFileItem.findAll({
      where: { folderId: folder.id },
      attributes: ['id', 'storedName'],
      transaction
    });

    await MyFileItem.destroy({
      where: { folderId: folder.id },
      transaction
    });

    await folder.destroy({ transaction });

    return {
      draftId: draft.id,
      folderId: folder.id,
      storedNames: items.map(item => item.storedName),
      deletedCount: items.length
    };
  });

  const failures = [];

  for (const storedName of result.storedNames) {
    try {
      await fs.rm(
        originalPath(result.draftId, storedName),
        { force: true }
      );
    } catch (error) {
      failures.push(storedName);

      console.error(
        `[MyFiles] Не удалось удалить файл ${storedName}:`,
        error
      );
    }
  }

  if (failures.length) {
    console.error(
      `[MyFiles] Папка ${result.folderId} удалена из БД, ` +
      `но ${failures.length} файлов остались на диске`
    );
  }

  return {
    success: true,
    id: result.folderId,
    deletedCount: result.deletedCount,
    storageErrors: failures.length
  };
};

exports.uploadFile = async (userId, folderId, file, uploadId) => {
  if (!file || Array.isArray(file)) {
    fail(400, 'Необходимо отправить один файл');
  }

  if (!file.data || !file.size || file.size > MAX_FILE_SIZE) {
    fail(413, 'Размер фотографии должен быть не больше 30 МБ');
  }

  if (
    typeof uploadId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uploadId)
  ) {
    fail(400, 'Отсутствует корректный идентификатор загрузки');
  }

  const folder = await ownedFolder(userId, folderId);
  const extension = path.extname(file.name || '').toLowerCase();
  const mimeType = EXTENSIONS[extension];

  if (!mimeType) {
    fail(400, 'Неподдерживаемый формат файла');
  }

  if (folder.type === 'template') {
    if (
      folder.name !== 'Фотополоски' ||
      folder.format !== '5,4×15,2'
    ) {
      fail(400, 'Неизвестный шаблон');
    }

    if (extension !== '.png') {
      fail(400, 'Для фотополосок требуется PNG');
    }

    let metadata;

    try {
      metadata = await sharp(file.data).metadata();
    } catch {
      fail(400, 'Повреждённый PNG');
    }

    if (
      metadata.format !== 'png' ||
      metadata.width !== 638 ||
      metadata.height !== 1795
    ) {
      fail(
        400,
        'Неверный размер фотополоски (ожидается 638×1795 пикселей)'
      );
    }
  }

  const isHeic =
    extension === '.heic' || extension === '.heif';

  const draftId = folder.draftId;

  const storedName =
    uploadId.toLowerCase() +
    (isHeic ? '.jpg' : extension);

  const filePath = originalPath(draftId, storedName);

  const incomingDir = path.join(storageRoot(), '.incoming');
  const tempId = crypto.randomUUID();

  const incomingPath =
    path.join(incomingDir, tempId + '.upload');

  const heicInputPath =
    path.join(incomingDir, tempId + extension);

  const jpegOutputPath =
    path.join(incomingDir, tempId + '.jpg');

  let tempFilePath = incomingPath;
  let moved = false;
  let committed = false;
  let storedSize = file.size;

  try {
    await fs.mkdir(incomingDir, { recursive: true });

    if (isHeic) {
      await fs.writeFile(heicInputPath, file.data, {
        flag: 'wx'
      });

      try {
        await execFileAsync(
          'heif-convert',
          [
            '-q',
            String(JPEG_QUALITY),
            heicInputPath,
            jpegOutputPath
          ],
          {
            timeout: CONVERSION_TIMEOUT,
            maxBuffer: 1024 * 1024
          }
        );
      } catch (error) {
        console.error(
          '[MyFiles] heif-convert:',
          error.stderr || error.message
        );

        fail(400, 'Не удалось преобразовать HEIC в JPEG');
      }

      tempFilePath = jpegOutputPath;

      const converted = await fs.stat(tempFilePath);

      if (!converted.size) {
        fail(400, 'Получен пустой JPEG после конвертации');
      }

      try {
        const metadata =
          await sharp(tempFilePath).metadata();

        if (metadata.format !== 'jpeg') {
          fail(400, 'Конвертер вернул файл неверного формата');
        }
      } catch (error) {
        if (error.status) throw error;

        console.error(
          '[MyFiles] Проверка JPEG:',
          error.message
        );

        fail(400, 'Не удалось проверить преобразованный JPEG');
      }

      storedSize = converted.size;
    } else {
      await fs.writeFile(incomingPath, file.data, {
        flag: 'wx'
      });
    }

    let item;

    await sequelize.transaction(async transaction => {
      const draft = await MyFileDraft.findOne({
        where: { id: draftId, userId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!draft || draft.status !== 'active') {
        fail(409, 'Черновик больше не активен');
      }

      if (isExpired(draft)) {
        fail(410, 'Срок хранения черновика истёк');
      }

      const currentFolder = await MyFileFolder.findOne({
        where: { id: folderId, draftId },
        transaction
      });

      if (!currentFolder) {
        fail(404, 'Папка была удалена');
      }

      if (
        currentFolder.type !== folder.type ||
        currentFolder.format !== folder.format ||
        currentFolder.name !== folder.name
      ) {
        fail(
          409,
          'Настройки папки изменились. Повторите сохранение.'
        );
      }

      item = await MyFileItem.findOne({
        where: { folderId, storedName },
        transaction
      });

      if (item) return;

      const otherItem = await MyFileItem.findOne({
        where: { storedName },
        include: [{
          model: MyFileFolder,
          required: true,
          where: { draftId }
        }],
        transaction
      });

      if (otherItem) {
        fail(
          409,
          'Идентификатор загрузки уже использован в другой папке'
        );
      }

      await fs.mkdir(originalsDir(draftId), {
        recursive: true
      });

      await fs.rename(tempFilePath, filePath);
      moved = true;

      const now = new Date();

      if (!draft.startedAt) {
        await draft.update(
          {
            startedAt: now,
            expiresAt: new Date(now.getTime() + 7 * DAY)
          },
          { transaction }
        );
      }

      item = await MyFileItem.create(
        {
          folderId,
          originalName: path.basename(file.name || 'photo'),
          storedName,
          path: filePath,
          size: storedSize,
          mimeType: isHeic ? 'image/jpeg' : mimeType,
          uploadStatus: 'uploaded',
          cropConfirmed: false,
          position: 0
        },
        { transaction }
      );
    });

    committed = true;
    return publicItem(item);
  } finally {
    await Promise.all([
      fs.rm(incomingPath, { force: true }),
      fs.rm(heicInputPath, { force: true }),
      fs.rm(jpegOutputPath, { force: true })
    ].map(promise => promise.catch(() => {})));

    if (moved && !committed) {
      await fs.rm(filePath, { force: true }).catch(() => {});
    }
  }
};

const previewPlaceholder = async () => {
  const svg = Buffer.from(`
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#f1f5f9"/>
      <rect x="125" y="105" width="150" height="190"
            rx="12" fill="#e2e8f0" stroke="#94a3b8"
            stroke-width="3"/>
      <text x="200" y="205" text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="25" fill="#475569">Фото</text>
      <text x="200" y="240" text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="14" fill="#64748b">Нет превью</text>
    </svg>
  `);

  return sharp(svg).jpeg({ quality: 80 }).toBuffer();
};

exports.getPreview = async (userId, itemId, large = false) => {
  const { item, draft } = await ownedItem(userId, itemId);

  if (item.uploadStatus !== 'uploaded') {
    fail(404, 'Фотография ещё не загружена');
  }

  const maxSize = large ? 1600 : 400;
  const quality = large ? 85 : 75;

  try {
    return await sharp(
      originalPath(draft.id, item.storedName),
      { limitInputPixels: 200000000 }
    )
      .rotate()
      .resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality,
        mozjpeg: true
      })
      .toBuffer();
  } catch (error) {
    console.error(
      `[MyFiles] Не удалось создать превью ${item.id}:`,
      error.message
    );

    return previewPlaceholder();
  }
};

exports.deleteFile = async (userId, itemId) => {
  const { item, draft } = await ownedItem(userId, itemId);
  const filePath = originalPath(draft.id, item.storedName);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await item.destroy();

  return {
    success: true,
    id: item.id
  };
};

const cleanupExpiredDraft = async draftId => {
  const shouldClean = await sequelize.transaction(
    async transaction => {
      const draft = await MyFileDraft.findByPk(draftId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!draft) return false;
      if (draft.status === 'expired') return true;

      if (
        draft.status !== 'active' ||
        !isExpired(draft)
      ) {
        return false;
      }

      await draft.update(
        { status: 'expired' },
        { transaction }
      );

      return true;
    }
  );

  if (!shouldClean) return false;

  await fs.rm(path.join(storageRoot(), draftId), {
    recursive: true,
    force: true
  });

  await sequelize.transaction(async transaction => {
    const draft = await MyFileDraft.findByPk(draftId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!draft || draft.status !== 'expired') return;

    const folders = await MyFileFolder.findAll({
      where: { draftId },
      attributes: ['id'],
      transaction
    });

    const folderIds = folders.map(folder => folder.id);

    if (folderIds.length) {
      await MyFileItem.destroy({
        where: {
          folderId: { [Op.in]: folderIds }
        },
        transaction
      });
    }

    await MyFileFolder.destroy({
      where: { draftId },
      transaction
    });

    await MyFileDraft.destroy({
      where: {
        id: draftId,
        status: 'expired'
      },
      transaction
    });
  });

  return true;
};

exports.cleanupExpiredDrafts = async () => {
  const drafts = await MyFileDraft.findAll({
    where: {
      [Op.or]: [
        {
          status: 'active',
          expiresAt: { [Op.lte]: new Date() }
        },
        {
          status: 'expired'
        }
      ]
    },
    order: [['createdAt', 'ASC']]
  });

  let deleted = 0;
  let errors = 0;

  for (const draft of drafts) {
    try {
      if (await cleanupExpiredDraft(draft.id)) {
        deleted++;
      }
    } catch (error) {
      errors++;

      console.error(
        `[MyFiles] Ошибка очистки ${draft.id}:`,
        error
      );
    }
  }

  if (drafts.length) {
    console.log(
      `[MyFiles] Очистка: удалено ${deleted}, ошибок ${errors}`
    );
  }

  return { deleted, errors };
};
