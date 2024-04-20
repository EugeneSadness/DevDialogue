const ApiError = require("../Error/ApiError");
const router = require("../routes");
const { ChatMessages, Chat, Message, User } = require('../models/models');
const tokenService = require('../middleware/tokenService');

class messageController {
    async getMessagesFromChat(req, res, next) {
        try {
            const { chatId } = req.body;
            const isExist = await Chat.findOne({ where: { id: chatId } });
            if (isExist === 0) {
                return next(ApiError.badRequest("Chat does not exist"));
            }
            const messageIds = await ChatMessages.findAll({
                attributes: ['messageId'],
                where: { chatId: chatId }
             });
            const ids = messageIds.map(id => id.messageId);
            const chatMessages = await Message.findAll({where:{id: ids}});
            for(const message of chatMessages){
                const user = await User.findOne({where:{id: message.senderId}});
                message.dataValues.username = user.name;
            }
            const filteredMessages = chatMessages.map(message => ({
                content: message.content,
                username: message.dataValues.username,
                senderId: message.senderId
            }));
            return res.status(200).json(filteredMessages);
        } catch (error) {
            console.error("Error with getting all messages from chat", error);
            return next(ApiError.internal("Error with getting all messages from chat"));
        }
    }
}

module.exports = new messageController();
