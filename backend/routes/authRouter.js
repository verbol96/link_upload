const {Router} = require('express')
const router = new Router()
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddlware')

router.post('/login', authController.login)
router.get('/logout', authController.logout)
router.get('/refresh', authController.refresh)
router.get('/whoAmI',authMiddleware, authController.whoAmI)
router.get('/getUsers',authMiddleware, authController.getUsers)
router.get('/deleteUsersWithoutOrders',authMiddleware, authController.deleteUsersWithoutOrders)
router.put('/dataChange', authController.dataChange)
router.put('/users_changeData', authController.users_changeData)
router.delete('/usersDelete/:id', authController.usersDelete);
router.post('/sendSms', authController.sendSms)
router.post('/setLogUser', authController.setLogUser)
router.get('/getLogUser', authController.getLogUser)
router.get('/clients', authController.clients)
router.get('/updateUsers', authController.updateUsers)
router.put('/clientUpdate/:id', authController.clientUpdate)
router.get('/clientsToLowerCase', authController.clientsToLowerCase)



module.exports = router