const Router = require("express");
const router = new Router();
const chatController = require("../controllers/chatController"); 

router.post('/createChat', chatController.createChat);
router.delete('/delChat', chatController.deleteChat);
router.get('/getChat:id');
router.get('/getUserChats', chatController.getUserChats);
router.post('/addUserToChat', chatController.addUserToChat);

module.exports = router;