const {Router} = require('express')
const router = new Router()
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddlware')

router.post('/registration' ,authController.registration)
router.post('/login', authController.login)
router.get('/logout', authController.logout)
router.get('/refresh', authController.refresh)

router.get('/whoAmI',authMiddleware, authController.whoAmI)
router.put('/passwordChange', authController.passwordChange)
router.get('/getUsers',authMiddleware, authController.getUsers)
router.put('/dataChange', authController.dataChange)
router.put('/addPW', authController.addPW)
 
module.exports = router