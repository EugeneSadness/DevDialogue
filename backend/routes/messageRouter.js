const Router = require("express");
const router = new Router();
const messageController = require('../controllers/messageController');

router.post('/enterMessage', messageController.enterMessage);
router.get('/delMessage', (req, res) => {
    res.json({message: "Empty was deleted, soon it will be able to work :)"});
});
router.get('/getMessage');

module.exports = router;