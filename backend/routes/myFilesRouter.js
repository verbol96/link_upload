
const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddlware');
const controller = require('../controllers/myFilesController');

const router = Router();

router.use(authMiddleware);

// Административное управление черновиками
router.get('/admin/drafts', controller.adminGetDrafts);
router.get('/admin/drafts/:id', controller.adminGetDraft);
router.delete('/admin/drafts/:id', controller.adminDeleteDraft);
router.get('/admin/files/:id/preview', controller.adminGetPreview);

// Личный кабинет клиента
router.get('/draft', controller.getDraft);
router.post('/folders', controller.createFolder);
router.patch('/folders/:id', controller.updateFolder);
router.delete('/folders/:id', controller.deleteFolder);

router.post('/folders/:folderId/files', controller.uploadFile);
router.get('/files/:id/preview', controller.getPreview);
router.delete('/files/:id', controller.deleteFile);

router.post('/submit', controller.submitDraft);

module.exports = router;
