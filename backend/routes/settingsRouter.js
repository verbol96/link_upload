const {Router} = require('express')
const router = new Router()
const settingsController = require('../controllers/settingsController')

router.post('/add',  settingsController.add)
router.get('/getAll', settingsController.getAll)
router.put('/update', settingsController.update)
router.delete('/delete/:id', settingsController.delete)
router.get('/getSettingsEditor', settingsController.getSettingsEditor)
router.put('/changeSettingsEditor', settingsController.changeSettingsEditor)
router.delete('/deleteSettingsEditor/:size', settingsController.deleteSettingsEditor)


module.exports = router