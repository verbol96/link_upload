const {Router} = require('express')
const router = new Router()
const expenseController = require('../controllers/expenseController');

router.get('/getAll', expenseController.getAll);
router.post('/add', expenseController.add);
router.put('/update/:id', expenseController.update);
router.delete('/delete/:id', expenseController.delete);
router.get('/stats', expenseController.getStats);

module.exports = router