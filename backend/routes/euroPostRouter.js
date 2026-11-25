const {Router} = require('express')
const router = new Router()
const euroPostController = require('../controllers/euroPostController')

router.get('/getListOps', euroPostController.getListOps)
router.post('/sendOrder', euroPostController.sendOrder)
router.post('/checkOrder', euroPostController.checkOrder)
router.post('/changeStatusEP', euroPostController.changeStatusEP) //отмечаю оплаченные европочты
router.get('/history', euroPostController.getOrderHistory)
router.get('/label/:number', euroPostController.getLabel);

router.post('/getInvoicesPay', euroPostController.getInvoicesPay)
router.post('/addInvoicesPay', euroPostController.addInvoicesPay)
router.post('/delInvoicesPay', euroPostController.delInvoicesPay)
router.post('/payNotice', euroPostController.payNotice)



module.exports = router