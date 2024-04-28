const {Router} = require('express')
const router = new Router()
const orderRouter = require('./orderRouter')
const settingsRouter = require('./settingsRouter')
const authRouter = require('./authRouter')
const fileRouter = require('./fileRouter')
const euroPostRouter = require('./euroPostRouter')

router.use('/order', orderRouter)
router.use('/settings', settingsRouter)
router.use('/auth', authRouter)
router.use('/file', fileRouter)
router.use('/ep', euroPostRouter)

module.exports = router