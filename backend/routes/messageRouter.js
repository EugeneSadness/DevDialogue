const Router = require("express");
const router = new Router();
const messageController = require('../controllers/messageController');

router.post('/getAllMessagesFromChat', messageController.getMessagesFromChat);
module.exports = router;