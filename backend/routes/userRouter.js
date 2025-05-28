const Router = require("express");
const router = new Router();
const userController = require('../controllers/userController');

router.post('/registration', userController.registration);
router.post('/login', userController.login);
router.get('/getId',userController.getUserId);
router.get('/getName',userController.getName);
router.get('/getNameById:id', userController.getNameById);
router.post('/findUserByName', userController.findByName);

// API для работы с онлайн-статусами пользователей
router.get('/online/:userId', userController.checkUserOnline);
router.get('/online', userController.getAllOnlineUsers);

module.exports = router;