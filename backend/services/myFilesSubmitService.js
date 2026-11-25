
const fs = require('fs/promises');
const path = require('path');
const sequelize = require('../db');
const {
  User,
  Order,
  Photo,
  File,
  MyFileDraft,
  MyFileFolder,
  MyFileItem
} = require('../models/models');

const ROOT_PARENT = '00000000-0000-0000-0000-000000000000';

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const getRoot = name => {
  const value = process.env[name];

  if (!value || !path.isAbsolute(value)) {
    throw new Error(`Не настроен абсолютный путь ${name}`);
  }

  return path.resolve(value);
};

const normalizePhone = value => {
  const digits = String(value || '').replace(/\D/g, '');

  if (!/^375(?:25|29|33|44)\d{7}$/.test(digits)) {
    fail(400, 'Некорректный номер телефона');
  }

  return `+${digits}`;
};

const normalizeMoney = value => {
  if (value === null || value === undefined || value === '') {
    fail(400, 'Не указана стоимость заказа');
  }

  const text = String(value).trim().replace(',', '.');

  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    fail(400, 'Некорректная стоимость заказа');
  }

  const number = Number(text);

  if (!Number.isFinite(number) || number < 0) {
    fail(400, 'Некорректная стоимость заказа');
  }

  return number.toFixed(2);
};

const safeName = value => {
  const result = String(value || 'Папка')
    .replace(/[\/\\<>:"|?*\x00-\x1f]/g, '_')
    .replace(/^\.+/, '_')
    .trim()
    .slice(0, 90);

  return result || 'Папка';
};

const dateForSending = typePost => {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 2);

  const europe = typePost === 'E' || typePost === 'E1';

  if (date.getDay() === 0) {
    date.setDate(date.getDate() + (europe ? 2 : 1));
  } else if (date.getDay() === 1 && europe) {
    date.setDate(date.getDate() + 1);
  } else if (date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }

  return date;
};

const originalPath = (root, draftId, storedName) => {
  if (
    !storedName ||
    typeof storedName !== 'string' ||
    path.basename(storedName) !== storedName ||
    storedName === '.' ||
    storedName === '..'
  ) {
    fail(400, 'Некорректное имя загруженного файла');
  }

  return path.join(root, draftId, 'originals', storedName);
};

const validateData = data => {
  if (!data || typeof data !== 'object') {
    fail(400, 'Не переданы данные заказа');
  }

  const FIO = String(data.FIO || '').trim();
  const city = String(data.city || '').trim();
  const adress = String(data.adress || '').trim();
  const typePost = String(data.typePost || '');

  if (!FIO) {
    fail(400, 'Укажите ФИО');
  }

  const phone = normalizePhone(data.phone);

  if (!['E', 'E1', 'R', 'R1', 'R2'].includes(typePost)) {
    fail(400, 'Выберите способ доставки');
  }

  if (!city || !adress) {
    fail(400, 'Заполните данные доставки');
  }

  const postCode = String(data.postCode || '').trim();
  const oblast = String(data.oblast || '').trim();

  if (['R', 'R1', 'R2'].includes(typePost)) {
    if (!postCode || !oblast) {
      fail(400, 'Заполните почтовый индекс и область');
    }
  }

  return {
    FIO,
    phone,
    typePost,
    city,
    adress,
    postCode,
    oblast,
    raion: String(data.raion || '').trim(),
    other: String(data.other || '').trim(),
    price: normalizeMoney(data.price),
    price_deliver: normalizeMoney(data.price_deliver)
  };
};

const getFolderItems = folder => {
  return folder.myFileItems || [];
};

exports.submitDraft = async (userId, requestData = {}) => {
  if (!userId) {
    fail(401, 'Необходима авторизация');
  }

  const data = validateData(requestData);

  const draftRoot = getRoot('FILEPATH_drafts');
  const orderRoot = getRoot('FILEPATH');

  const transaction = await sequelize.transaction();

  const movedFiles = [];

  let createdDirectory = null;
  let committed = false;

  try {
    // Блокировка черновика от повторного оформления
    const draft = await MyFileDraft.findOne({
      where: {
        userId,
        status: 'active'
      },
      order: [['createdAt', 'DESC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!draft) {
      fail(404, 'Активный черновик не найден');
    }

    if (
      draft.expiresAt &&
      new Date(draft.expiresAt).getTime() <= Date.now()
    ) {
      fail(410, 'Срок хранения черновика истёк');
    }

    const folders = await MyFileFolder.findAll({
      where: { draftId: draft.id },
      include: [{
        model: MyFileItem,
        required: false
      }],
      order: [['position', 'ASC']],
      transaction
    });

    const nonEmptyFolders = folders.filter(
      folder => getFolderItems(folder).length > 0
    );

    if (!nonEmptyFolders.length) {
      fail(400, 'Добавьте фотографии в заказ');
    }

    // ===== Проверка всех файлов =====

    for (const folder of folders) {
      const items = getFolderItems(folder);

      for (const item of items) {
        if (
          item.uploadStatus !== 'uploaded' ||
          !item.storedName
        ) {
          fail(
            400,
            'Не все фотографии загружены. Дождитесь завершения загрузки'
          );
        }

        const source = originalPath(
          draftRoot,
          draft.id,
          item.storedName
        );

        try {
          const stat = await fs.stat(source);

          if (!stat.isFile()) {
            fail(400, `Файл ${item.originalName} недоступен`);
          }
        } catch (error) {
          if (error.status) throw error;

          fail(
            400,
            `Не найден оригинал: ${item.originalName}`
          );
        }
      }
    }

    // ===== Получение пользователя =====

    const user = await User.findByPk(userId, {
      transaction
    });

    if (!user) {
      fail(404, 'Пользователь не найден');
    }

    // ===== Формирование примечаний =====

    const folderNotes = folders
      .filter(folder => folder.note?.trim())
      .map(folder => {
        const name =
          folder.name?.trim() ||
          folder.format ||
          'Без названия';

        return `Папка «${name}»: ${folder.note.trim()}`;
      });

    const orderOther = [
      data.other,
      ...folderNotes
    ].filter(Boolean).join('\n\n');

    // ===== Создание заказа =====

    const order = await Order.create({
      ...data,
      other: orderOther,
      userId: user.id,
      status: 0,
      origin: 'website',
      date_sent: dateForSending(data.typePost)
    }, { transaction });

    // ===== Создание основной папки заказа =====

    const prefix = ['R', 'R1', 'R2'].includes(data.typePost)
      ? 'R'
      : 'E';

    const directoryName = `${prefix}${order.order_number % 1000}`;

    const directoryPath = path.join(
      orderRoot,
      directoryName
    );

    await fs.mkdir(directoryPath);

    createdDirectory = directoryPath;

    const mainDir = await File.create({
      name: directoryName,
      type: 'dir',
      path: '',
      parent: ROOT_PARENT,
      isDownload: false
    }, { transaction });

    await order.update({
      main_dir_id: mainDir.id
    }, { transaction });

    let fileCount = 0;

    // ===== Создание позиций и перенос файлов =====

    for (
      let index = 0;
      index < nonEmptyFolders.length;
      index++
    ) {
      const folder = nonEmptyFolders[index];
      const items = getFolderItems(folder);

      const photo = await Photo.create({
        orderId: order.id,
        type: folder.type,
        format: folder.format,
        amount: items.length,
        copies: 1,
        paper: folder.paperType || null
      }, { transaction });

      // Уникальное имя папки формата
      const folderName = [
        String(index + 1).padStart(2, '0'),
        safeName(folder.name),
        folder.id.slice(0, 8)
      ].join('_');

      const folderPath = path.join(
        directoryPath,
        folderName
      );

      await fs.mkdir(folderPath);

      const directoryRecord = await File.create({
        name: folderName,
        type: 'dir',
        path: directoryName,
        parent: mainDir.id,
        isDownload: false
      }, { transaction });

      for (const item of items) {
        const source = originalPath(
          draftRoot,
          draft.id,
          item.storedName
        );

        const extension = path.extname(
          item.originalName || item.storedName
        );

        const baseName = safeName(
          path.basename(
            item.originalName || item.storedName,
            extension
          )
        );

        const name = `${item.id}_${baseName}${extension}`;

        const destination = path.join(
          folderPath,
          name
        );

        // Перенос оригинала в папку заказа
        await fs.rename(source, destination);

        movedFiles.push({
          source,
          destination
        });

        await File.create({
          name,
          type: extension.slice(1).toLowerCase(),
          size: Number(item.size) || 0,
          path: `${directoryName}/${folderName}`,
          parent: directoryRecord.id,
          photoId: photo.id,
          isDownload: false
        }, { transaction });

        fileCount++;
      }
    }

    // ===== Завершение черновика =====

    await draft.update({
      status: 'completed'
    }, { transaction });

    // ===== Обновление данных клиента =====

    if (user.role === 'USER') {
      await user.update({
        FIO: data.FIO,
        typePost: data.typePost,
        postCode: data.postCode,
        city: data.city,
        adress: data.adress,
        oblast: data.oblast,
        raion: data.raion
      }, { transaction });
    }

    // ===== Завершение транзакции =====

    await transaction.commit();

    committed = true;

    // ===== Удаление физической папки черновика =====

    try {
      const draftDirectory = path.join(
        draftRoot,
        draft.id
      );

      await fs.rm(draftDirectory, {
        recursive: true,
        force: true
      });

    } catch (cleanupError) {
      console.error(
        '[MyFiles] Ошибка удаления папки черновика:',
        {
          draftId: draft.id,
          error: cleanupError
        }
      );
    }

    // ===== Успешное оформление =====

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      mainDirId: mainDir.id,
      fileCount
    };

  } catch (error) {

    if (committed) {
      throw error;
    }

    // ===== Откат транзакции =====

    if (!transaction.finished) {
      try {
        await transaction.rollback();

      } catch (rollbackError) {
        console.error(
          '[MyFiles] Ошибка отката транзакции:',
          rollbackError
        );
      }
    }

    let restoreFailed = false;

    // ===== Возврат оригиналов в черновик =====

    for (const file of [...movedFiles].reverse()) {
      try {
        await fs.mkdir(path.dirname(file.source), {
          recursive: true
        });

        await fs.rename(
          file.destination,
          file.source
        );

      } catch (restoreError) {
        restoreFailed = true;

        console.error(
          '[MyFiles] КРИТИЧЕСКАЯ ОШИБКА восстановления файла:',
          {
            source: file.source,
            destination: file.destination,
            error: restoreError
          }
        );
      }
    }

    // ===== Удаление неудавшегося заказа =====

    if (createdDirectory && !restoreFailed) {
      try {
        await fs.rm(createdDirectory, {
          recursive: true,
          force: true
        });

      } catch (cleanupError) {
        console.error(
          '[MyFiles] Ошибка очистки папки заказа:',
          cleanupError
        );
      }
    }

    if (restoreFailed) {
      const recoveryError = new Error(
        'Ошибка оформления. Некоторые файлы не удалось ' +
        'вернуть в черновик. Обратитесь к администратору'
      );

      recoveryError.status = 500;

      throw recoveryError;
    }

    throw error;
  }
};