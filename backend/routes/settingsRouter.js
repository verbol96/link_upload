const {Router} = require('express')
const router = new Router()
const settingsController = require('../controllers/settingsController')

router.post('/add',  settingsController.add)
router.get('/getAll', settingsController.getAll)
router.put('/update', settingsController.update)
router.delete('/delete/:id', settingsController.delete)
router.get('/getCopyBD', settingsController.getCopyBD)
router.post('/setCopyDB',  settingsController.setCopyDB)
router.get('/getSettingEditor', settingsController.getSettingEditor)
router.put('/changeSettingEditor', settingsController.changeSettingEditor)
router.delete('/deleteSettingEditor/:name', settingsController.deleteSettingEditor)
router.post('/changePriceDel',  settingsController.changePriceDel)

module.exports = router