const Router = require("express");
const router = new Router();

router.post('/sendFile');
router.get('/getFile');
router.post('/downloadFile');

module.exports = router;