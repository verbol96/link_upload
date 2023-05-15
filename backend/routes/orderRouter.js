const {Router} = require('express')
const router = new Router()
const orderController = require('../controllers/orderController')

router.post('/addOrder',  orderController.addOrder)
router.get('/getAll', orderController.getAll)
router.put('/updateStatus/:id', orderController.updateStatus)
router.put('/updateOrder/:id', orderController.updateOrder)
router.delete('/deleteOrder/:id', orderController.deleteOrder)
router.delete('/deleteUser/:id', orderController.deleteUser)

router.post('/setCopyDB',  orderController.setCopyDB)

module.exports = router