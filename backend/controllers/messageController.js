const ApiError = require("../Error/ApiError");
const router = require("../routes");
const modelsPromise = require('../models/models');
const tokenService = require('../middleware/tokenService');

let ChatMessages, Chat, Message, User;

async function initializeModels() {
    try {
        const models = await modelsPromise;
        ChatMessages = models.ChatMessages;
        Chat = models.Chat;
        Message = models.Message;
        User = models.User;
        console.log('Модели успешно загружены в контроллере сообщений');
    } catch (error) {
        console.error('Ошибка при инициализации моделей в контроллере сообщений:', error);
    }
}

initializeModels();

class messageController {
    async getMessagesFromChat(req, res, next) {
        if (!Chat || !ChatMessages || !Message || !User) {
            console.error('Модели не инициализированы');
            try {
                await initializeModels();
                if (!Chat || !ChatMessages || !Message || !User) {
                    return next(ApiError.internal("Database models are not initialized"));
                }
            } catch (initError) {
                return next(ApiError.internal(`Failed to initialize models: ${initError.message}`));
            }
        }
        try {
            console.log('Получен запрос на историю чата. Тело запроса:', req.body);
            
            const { chatId } = req.body;
            if (!chatId) {
                console.error('Отсутствует ID чата в запросе');
                return next(ApiError.badRequest("Chat ID is required"));
            }
            
            console.log('Проверка существования чата с ID:', chatId);
            
            try {
                const chat = await Chat.findOne({ where: { id: chatId } });
                if (!chat) {
                    console.error('Чат не найден:', chatId);
                    return next(ApiError.badRequest("Chat does not exist"));
                }
                console.log('Чат найден:', chat.id, chat.title);
            } catch (chatError) {
                console.error('Ошибка при поиске чата:', chatError);
                return next(ApiError.internal(`Error finding chat: ${chatError.message}`));
            }
            
            try {
                console.log('Поиск сообщений для чата с ID:', chatId);
                
                const chatMessagesAttributes = Object.keys(ChatMessages.rawAttributes);
                console.log('Атрибуты модели ChatMessages:', chatMessagesAttributes);
                
                const messageIds = await ChatMessages.findAll({
                    where: { chatId: chatId }
                });
                
                console.log('Найденные связи чат-сообщения:', messageIds);
                
                if (!messageIds || messageIds.length === 0) {
                    console.log('Сообщений в чате не найдено');
                    return res.status(200).json([]);
                }
                
                const ids = messageIds.map(item => {
                    if (item.messageId) {
                        return item.messageId;
                    } else if (item.dataValues && item.dataValues.messageId) {
                        return item.dataValues.messageId;
                    } else {
                        console.log('Структура объекта:', item);
                        return null;
                    }
                }).filter(id => id !== null);
                
                console.log('Найдено сообщений:', ids.length);
                
                const chatMessages = await Message.findAll({where: {id: ids}});
                console.log('Получено сообщений из базы:', chatMessages.length);
                
                for (const message of chatMessages) {
                    try {
                        const user = await User.findOne({where: {id: message.senderId}});
                        if (user) {
                            message.dataValues.username = user.name;
                            message.dataValues.email = user.email;
                        } else {
                            message.dataValues.username = 'Unknown';
                            message.dataValues.email = '';
                        }
                    } catch (userError) {
                        console.error('Ошибка при получении данных пользователя:', userError);
                        message.dataValues.username = 'Error';
                        message.dataValues.email = '';
                    }
                }
                
                const filteredMessages = chatMessages.map(message => ({
                    content: message.content,
                    username: message.dataValues.username,
                    email: message.dataValues.email,
                    senderId: message.senderId,
                    chatId: chatId
                }));
                
                console.log('Отправка сообщений клиенту:', filteredMessages.length);
                return res.status(200).json(filteredMessages);
            } catch (messagesError) {
                console.error('Ошибка при получении сообщений:', messagesError);
                return next(ApiError.internal(`Error fetching messages: ${messagesError.message}`));
            }
        } catch (error) {
            console.error("Error with getting all messages from chat", error);
            return next(ApiError.internal(`Error with getting all messages from chat: ${error.message}`));
        }
    }
    async deleteAllMessagesFromChat(req, res, next){
        if (!Chat || !ChatMessages || !Message || !User) {
            console.error('Модели не инициализированы');
            try {
                await initializeModels();
                if (!Chat || !ChatMessages || !Message || !User) {
                    return next(ApiError.internal("Database models are not initialized"));
                }
            } catch (initError) {
                return next(ApiError.internal(`Failed to initialize models: ${initError.message}`));
            }
        }
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
