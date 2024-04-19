const Router = require("express");
const router = new Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/registration', userController.registration);
router.post('/login', userController.login);
router.get('/getId',userController.getUserId);
router.get('/getName',userController.getName);
router.get('/getNameById:id', userController.getNameById);


module.exports = router;