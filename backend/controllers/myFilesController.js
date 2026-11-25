
const service = require('../services/myFilesService');
const submitService = require('../services/myFilesSubmitService');
const adminService = require('../services/myFilesAdminService');
const { User } = require('../models/models');

const run = handler => async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: 'Необходима авторизация'
      });
    }

    await handler(req, res);
  } catch (error) {
    console.error('[MyFiles]', error);

    res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : 'Внутренняя ошибка сервера'
    });
  }
};

const adminOnly = handler => run(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'role']
  });

  if (!user || !['ADMIN', 'WORKER'].includes(user.role)) {
    return res.status(403).json({
      message: 'Недостаточно прав'
    });
  }

  await handler(req, res);
});

exports.getDraft = run(async (req, res) => {
  res.json(await service.getDraft(req.user.id));
});

exports.createFolder = run(async (req, res) => {
  res.status(201).json(
    await service.createFolder(req.user.id, req.body)
  );
});

exports.updateFolder = run(async (req, res) => {
  res.json(
    await service.updateFolder(
      req.user.id,
      req.params.id,
      req.body
    )
  );
});

exports.deleteFolder = run(async (req, res) => {
  res.json(
    await service.deleteFolder(req.user.id, req.params.id)
  );
});

exports.uploadFile = run(async (req, res) => {
  res.status(201).json(
    await service.uploadFile(
      req.user.id,
      req.params.folderId,
      req.files?.file,
      req.get('X-Upload-Id')
    )
  );
});

exports.getPreview = run(async (req, res) => {
  const buffer = await service.getPreview(
    req.user.id,
    req.params.id,
    req.query.size === 'large'
  );

  res.set('Content-Type', 'image/jpeg');
  res.set('Cache-Control', 'private, max-age=3600');
  res.send(buffer);
});

exports.deleteFile = run(async (req, res) => {
  res.json(
    await service.deleteFile(req.user.id, req.params.id)
  );
});

exports.submitDraft = run(async (req, res) => {
  const result = await submitService.submitDraft(
    req.user.id,
    req.body
  );

  res.status(201).json(result);
});

exports.adminGetDrafts = adminOnly(async (req, res) => {
  res.json(await adminService.getDrafts());
});

exports.adminGetDraft = adminOnly(async (req, res) => {
  res.json(await adminService.getDraft(req.params.id));
});

exports.adminGetPreview = adminOnly(async (req, res) => {
  const buffer = await adminService.getPreview(
    req.params.id,
    req.query.size === 'large'
  );

  res.set('Content-Type', 'image/jpeg');
  res.set('Cache-Control', 'private, max-age=3600');
  res.send(buffer);
});

exports.adminDeleteDraft = adminOnly(async (req, res) => {
  res.json(await adminService.deleteDraft(req.params.id));
});
