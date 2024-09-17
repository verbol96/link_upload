const {Router} = require('express')
const router = new Router()
const euroPostController = require('../controllers/euroPostController')

router.get('/getListOps', euroPostController.getListOps)
router.get('/getInfo', euroPostController.getInfo)
router.post('/sendOrder', euroPostController.sendOrder)

router.post('/getInvoicesPay', euroPostController.getInvoicesPay)
router.post('/addInvoicesPay', euroPostController.addInvoicesPay)
router.post('/delInvoicesPay', euroPostController.delInvoicesPay)
router.post('/payNotice', euroPostController.payNotice)

module.exports = router