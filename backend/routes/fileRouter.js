const {Router} = require('express')
const router = new Router()
const fileController = require('../controllers/fileController')
const authMiddleware = require('../middleware/authMiddlware')

router.post('', fileController.createDir)
router.post('/upload', fileController.uploadFiles)
router.get('', fileController.getFiles)
router.delete('', fileController.deleteFile)
router.get('/download', fileController.downloadFile)
 
module.exports = router