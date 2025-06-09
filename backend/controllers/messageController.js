const ApiError = require("../Error/ApiError");
const router = require("../routes");
const modelsPromise = require('../models/models');
const tokenService = require('../middleware/tokenService');

// In-memory кэш для истории чатов (заменяет Redis)
const chatHistoryCache = new Map();
const CACHE_TTL = 300000; // 5 минут в миллисекундах

// Функции для работы с кэшем (заменяют Redis функции)
function getCachedChatHistory(chatId) {
    const cached = chatHistoryCache.get(chatId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function clearChatHistory(chatId) {
    chatHistoryCache.delete(chatId);
}

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
            
            const { chatId, page = 0, limit = 30 } = req.body;
            if (!chatId) {
                console.error('Отсутствует ID чата в запросе');
                return next(ApiError.badRequest("Chat ID is required"));
            }
            
            console.log(`Запрошена страница ${page}, лимит ${limit} сообщений для чата ${chatId}`);
            
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
            
            // Пробуем получить историю сообщений из Redis
            try {
                console.log('Попытка получить историю из Redis для чата:', chatId);
                // Вычисляем индексы для выборки из Redis
                const startIndex = page * limit;
                const endIndex = startIndex + limit - 1;
                const cachedMessages = await getCachedChatHistory(chatId, startIndex, endIndex);
                
                if (cachedMessages && cachedMessages.length > 0) {
                    console.log('Получена история из Redis:', cachedMessages.length, 'сообщений (страница', page, ')');
                    
                    // Дополняем сообщения данными пользователей, если они отсутствуют
                    const messagesWithUserInfo = await Promise.all(cachedMessages.map(async (message) => {
                        if (!message.username || !message.email) {
                            try {
                                const user = await User.findOne({ where: { id: message.senderId } });
                                if (user) {
                                    return {
                                        ...message,
                                        username: user.name,
                                        email: user.email,
                                        chatId
                                    };
                                }
                            } catch (error) {
                                console.error('Ошибка при получении данных пользователя:', error);
                            }
                        }
                        return {
                            ...message,
                            username: message.username || 'Unknown',
                            email: message.email || '',
                            chatId
                        };
                    }));
                    
                    // Получаем общее количество сообщений в чате для пагинации
                    const totalMessages = await ChatMessages.count({ where: { chatId } });
                    
                    console.log('Отправка кэшированных сообщений клиенту:', messagesWithUserInfo.length);
                    return res.status(200).json({
                        messages: messagesWithUserInfo,
                        pagination: {
                            total: totalMessages,
                            page,
                            limit,
                            hasMore: totalMessages > (page + 1) * limit
                        }
                    });
                }
                
                console.log('В кэше Redis нет данных, получаем из базы данных');
            } catch (redisError) {
                console.error('Ошибка при получении данных из Redis:', redisError);
                console.log('Продолжаем получение данных из базы');
            }
            
            try {
                console.log('Поиск сообщений для чата с ID:', chatId);
                
                // Получаем общее количество сообщений в чате для пагинации
                const totalMessages = await ChatMessages.count({ where: { chatId } });
                
                const messageIds = await ChatMessages.findAll({
                    where: { chatId: chatId },
                    order: [['id', 'DESC']], // Сортируем по убыванию ID для получения последних сообщений
                    offset: page * limit,
                    limit: limit
                });
                
                console.log('Найденные связи чат-сообщения:', messageIds);
                
                if (!messageIds || messageIds.length === 0) {
                    console.log('Сообщений в чате не найдено');
                    return res.status(200).json({
                        messages: [],
                        pagination: {
                            total: totalMessages,
                            page,
                            limit,
                            hasMore: false
                        }
                    });
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
                
                const chatMessages = await Message.findAll({
                    where: {id: ids},
                    order: [['id', 'DESC']] // Сортируем по убыванию ID
                });
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
                    id: message.id,
                    content: message.content,
                    username: message.dataValues.username,
                    email: message.dataValues.email,
                    senderId: message.senderId,
                    chatId: chatId,
                    timestamp: message.createdAt ? message.createdAt.toISOString() : new Date().toISOString()
                }));
                
                console.log('Отправка сообщений клиенту:', filteredMessages.length);
                return res.status(200).json({
                    messages: filteredMessages,
                    pagination: {
                        total: totalMessages,
                        page,
                        limit,
                        hasMore: totalMessages > (page + 1) * limit
                    }
                });
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
            
            // Очищаем кэш сообщений в Redis
            try {
                await clearChatHistory(chatId);
                console.log(`Кэш истории чата ${chatId} очищен в Redis`);
            } catch (redisError) {
                console.error(`Ошибка при очистке кэша чата ${chatId} в Redis:`, redisError);
            }
            
            // Удаляем сообщения из базы данных
            const messageIds = await ChatMessages.findAll({where: {chatId: chatId}});
            if(messageIds.length === 0){
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
