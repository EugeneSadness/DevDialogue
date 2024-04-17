const Router = require("express");
const router = new Router();
const chatRouter = require("./chatRouter")
const fileRouter = require("./fileRouter")
const messageRouter = require("./messageRouter")
const userRouter = require("./userRouter")


router.use('/chat', chatRouter);
router.use('/file', fileRouter);
router.use('/message', messageRouter);
router.use('/user', userRouter);

module.exports = router;