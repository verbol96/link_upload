const {Router} = require('express')
const router = new Router()
const fileController = require('../controllers/fileController')

router.post('', fileController.createDir)
router.post('/upload', fileController.uploadFiles)
router.get('', fileController.getFiles)
router.get('/getFilesAll', fileController.getFilesAll)
router.delete('', fileController.deleteFile)
router.delete('/all', fileController.deleteFileAll)
router.get('/download', fileController.downloadFile)
router.get('/thumb', fileController.displayFile)
router.post('/getFilesPhotosId', fileController.getFilesPhotosId)

router.post('/importBackup', fileController.importBackup)

module.exports = router