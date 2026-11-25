
const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const { Op } = require('sequelize');
const {
  User,
  MyFileDraft,
  MyFileFolder,
  MyFileItem
} = require('../models/models');

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const publicItem = item => ({
  id: item.id,
  folderId: item.folderId,
  originalName: item.originalName,
  size: item.size,
  mimeType: item.mimeType,
  uploadStatus: item.uploadStatus,
  position: item.position
});

const publicFolder = folder => ({
  id: folder.id,
  name: folder.name,
  type: folder.type,
  format: folder.format,
  settingId: folder.settingId,
  paperType: folder.paperType,
  note: folder.note || '',
  position: folder.position,
  items: folder.myFileItems
    .filter(item => item.uploadStatus === 'uploaded')
    .sort((a, b) => a.position - b.position)
    .map(publicItem)
});

const draftWhere = () => ({
  status: 'active',
  startedAt: { [Op.ne]: null },
  expiresAt: { [Op.gt]: new Date() }
});

const getDraftWithFiles = async id => {
  const draft = await MyFileDraft.findOne({
    where: { id, ...draftWhere() },
    include: [
      {
        model: User,
        attributes: ['id', 'FIO', 'phone']
      },
      {
        model: MyFileFolder,
        include: [{
          model: MyFileItem,
          required: false
        }]
      }
    ]
  });

  if (!draft) fail(404, 'Активный черновик не найден');
  return draft;
};

exports.getDrafts = async () => {
  const drafts = await MyFileDraft.findAll({
    where: draftWhere(),
    include: [
      {
        model: User,
        attributes: ['id', 'FIO', 'phone']
      },
      {
        model: MyFileFolder,
        attributes: ['id'],
        required: true,
        include: [{
          model: MyFileItem,
          attributes: ['id', 'createdAt', 'size'],
          where: { uploadStatus: 'uploaded' },
          required: true
        }]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return drafts.map(draft => {
    const items = draft.myFileFolders.flatMap(
      folder => folder.myFileItems
    );

    const lastUploadAt = items.reduce((latest, item) => {
      const time = new Date(item.createdAt).getTime();
      return Math.max(latest, time);
    }, 0);

    return {
      id: draft.id,
      userId: draft.userId,
      FIO: draft.user?.FIO || '',
      phone: draft.user?.phone || '',
      startedAt: draft.startedAt,
      expiresAt: draft.expiresAt,
      fileCount: items.length,
      folderCount: draft.myFileFolders.length,
      totalSize: items.reduce(
        (sum, item) => sum + (Number(item.size) || 0),
        0
        ),
      lastUploadAt: lastUploadAt
        ? new Date(lastUploadAt).toISOString()
        : null
    };
  }).sort((a, b) =>
    new Date(b.lastUploadAt || 0) -
    new Date(a.lastUploadAt || 0)
  );
};

exports.getDraft = async id => {
  const draft = await getDraftWithFiles(id);

  const folders = draft.myFileFolders
    .sort((a, b) =>
      a.position - b.position ||
      new Date(a.createdAt) - new Date(b.createdAt)
    )
    .map(publicFolder);

  const fileCount = folders.reduce(
    (sum, folder) => sum + folder.items.length,
    0
  );

  const lastUploadAt = draft.myFileFolders
    .flatMap(folder => folder.myFileItems)
    .filter(item => item.uploadStatus === 'uploaded')
    .reduce((latest, item) =>
      Math.max(latest, new Date(item.createdAt).getTime()), 0
    );

  return {
    id: draft.id,
    userId: draft.userId,
    status: draft.status,
    FIO: draft.user?.FIO || '',
    phone: draft.user?.phone || '',
    startedAt: draft.startedAt,
    expiresAt: draft.expiresAt,
    lastUploadAt: lastUploadAt
      ? new Date(lastUploadAt).toISOString()
      : null,
    fileCount,
    folders
  };
};

exports.getPreview = async (itemId, large = false) => {
  const item = await MyFileItem.findOne({
    where: {
      id: itemId,
      uploadStatus: 'uploaded'
    },
    include: [{
      model: MyFileFolder,
      required: true,
      include: [{
        model: MyFileDraft,
        required: true,
        where: draftWhere()
      }]
    }]
  });

  if (!item) fail(404, 'Фотография не найдена');

  const draft = item.myFileFolder.myFileDraft;
  const root = process.env.FILEPATH_drafts;

  if (!root || !path.isAbsolute(root)) {
    fail(500, 'Не настроен FILEPATH_drafts');
  }

  if (
    !item.storedName ||
    path.basename(item.storedName) !== item.storedName
  ) {
    fail(404, 'Файл не найден');
  }

  const filePath = path.join(
    root,
    draft.id,
    'originals',
    item.storedName
  );

  try {
    await fs.access(filePath);

    return await sharp(filePath, {
      limitInputPixels: 200000000
    })
      .rotate()
      .resize(large ? 1600 : 400, large ? 1600 : 400, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: large ? 85 : 75,
        mozjpeg: true
      })
      .toBuffer();
  } catch (error) {
    console.error('[MyFilesAdmin] Preview:', error);
    fail(404, 'Не удалось открыть фотографию');
  }
};

exports.deleteDraft = async id => {
  const root = process.env.FILEPATH_drafts;

  if (!root || !path.isAbsolute(root)) {
    fail(500, 'Не настроен FILEPATH_drafts');
  }

  const draftPath = path.join(root, id);
  const transaction = await MyFileDraft.sequelize.transaction();

  try {
    const draft = await MyFileDraft.findOne({
      where: {
        id,
        ...draftWhere()
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!draft) {
      fail(404, 'Активный черновик не найден');
    }

    const folders = await MyFileFolder.findAll({
      where: { draftId: draft.id },
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
      where: { draftId: draft.id },
      transaction
    });

    await draft.destroy({ transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  try {
    await fs.rm(draftPath, {
      recursive: true,
      force: true
    });
  } catch (error) {
    console.error(
      `[MyFilesAdmin] Ошибка удаления файлов черновика ${id}:`,
      error
    );

    return {
      success: true,
      filesRemoved: false
    };
  }

  return {
    success: true,
    filesRemoved: true
  };
};
