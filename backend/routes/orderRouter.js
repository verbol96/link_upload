const {Router} = require('express')
const router = new Router()
const orderController = require('../controllers/orderController')

router.post('/addOrder',  orderController.addOrder)
router.get('/getAll', orderController.getAll)
router.get('/getAllArchive', orderController.getAllArchive)
router.get('/getAllStat', orderController.getAllStat)
router.put('/updateStatus/:id', orderController.updateStatus)
router.put('/updateOrder/:id', orderController.updateOrder)
router.put('/updateUserAdress/:id', orderController.updateUserAdress)
router.delete('/deleteOrder/:id', orderController.deleteOrder)
router.delete('/deleteUser/:id', orderController.deleteUser)
router.post('/getOneUser', orderController.getOneUser)

router.post('/setCopyDB',  orderController.setCopyDB)

module.exports = router