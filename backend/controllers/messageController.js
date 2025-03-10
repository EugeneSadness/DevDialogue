const ApiError = require("../Error/ApiError");
const router = require("../routes");
const { ChatMessages, Chat, Message, User } = require('../models/models');
const tokenService = require('../middleware/tokenService');

class messageController {
    async getMessagesFromChat(req, res, next) {
        try {
            const { chatId } = req.body;
            console.log('Получен запрос на историю чата:', chatId);
            
            // Проверка существования чата
            const chat = await Chat.findOne({ where: { id: chatId } });
            if (!chat) {
                console.error('Чат не найден:', chatId);
                return next(ApiError.badRequest("Chat does not exist"));
            }
            
            // Получение ID сообщений для данного чата
            const messageIds = await ChatMessages.findAll({
                attributes: ['messageId'],
                where: { chatId: chatId }
            });
            
            if (!messageIds || messageIds.length === 0) {
                console.log('Сообщений в чате не найдено');
                return res.status(200).json([]);
            }
            
            const ids = messageIds.map(id => id.messageId);
            console.log('Найдено сообщений:', ids.length);
            
            // Получение данных сообщений
            const chatMessages = await Message.findAll({where: {id: ids}});
            
            // Добавление информации о пользователях
            for (const message of chatMessages) {
                const user = await User.findOne({where: {id: message.senderId}});
                if (user) {
                    message.dataValues.username = user.name;
                    message.dataValues.email = user.email;
                } else {
                    message.dataValues.username = 'Unknown';
                    message.dataValues.email = '';
                }
            }
            
            // Форматирование сообщений для отправки
            const filteredMessages = chatMessages.map(message => ({
                content: message.content,
                username: message.dataValues.username,
                email: message.dataValues.email,
                senderId: message.senderId,
                chatId: chatId
            }));
            
            console.log('Отправка сообщений клиенту:', filteredMessages.length);
            return res.status(200).json(filteredMessages);
        } catch (error) {
            console.error("Error with getting all messages from chat", error);
            return next(ApiError.internal("Error with getting all messages from chat"));
        }
    }
    async deleteAllMessagesFromChat(req, res, next){
        try{
            const {chatId} = req.body;
            const messageIds = await ChatMessages.findAll({where: {chatId: chatId}});
            if(messageIds === 0){
                return res.status(200).json({message: "This chat was empty!"});
            }
            for(const message of messageIds){
                await Message.destroy({where: {id: message.messageId}});
            }
            await ChatMessages.destroy({where: {chatId: chatId}});
            return res.status(200).json({message: "Chat history has cleared!"});
        } catch (error){
            console.error("Error with deleting all messages from chat", error);
            return next(ApiError.internal("Error with deleting all messages from chat"));
        }
    }
}

module.exports = new messageController();
