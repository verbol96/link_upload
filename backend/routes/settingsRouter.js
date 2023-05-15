const {Router} = require('express')
const router = new Router()
const settingsController = require('../controllers/settingsController')

router.post('/add',  settingsController.add)
router.get('/getAll', settingsController.getAll)
router.put('/update', settingsController.update)
router.delete('/delete/:id', settingsController.delete)



module.exports = router