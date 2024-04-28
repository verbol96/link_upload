const {Router} = require('express')
const router = new Router()
const euroPostController = require('../controllers/euroPostController')

router.get('/getListOps', euroPostController.getListOps)
router.get('/getInfo', euroPostController.getInfo)
router.post('/sendOrder', euroPostController.sendOrder)

module.exports = router