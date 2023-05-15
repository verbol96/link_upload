const {Router} = require('express')
const router = new Router()
const fileController = require('../controllers/fileController')
const authMiddleware = require('../middleware/authMiddlware')

router.post('', authMiddleware, fileController.createDir)
router.post('/upload', authMiddleware, fileController.uploadFiles)
router.get('', authMiddleware, fileController.getFiles)
router.delete('', authMiddleware, fileController.deleteFile)
router.get('/download', authMiddleware, fileController.downloadFile)
 
module.exports = router