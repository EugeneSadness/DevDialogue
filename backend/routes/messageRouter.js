const Router = require("express");
const router = new Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// router.use(authMiddleware);

router.post('/getAllMessagesFromChat', messageController.getMessagesFromChat);
router.post('/delAllMessagesFromChat', messageController.deleteAllMessagesFromChat);
module.exports = router;