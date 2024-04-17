const Router = require("express");
const router = new Router();

router.post('/createChat');
router.post('/delChat');
router.get('/getChat:id');


module.exports = router;