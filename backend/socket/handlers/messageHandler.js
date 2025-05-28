const modelsPromise = require('../../models/models');
const ApiError = require("../../Error/ApiError");
const { json } = require('express');
require("dotenv").config();
const { 
  cacheChatMessageBatch,
  batchUpdateUnreadCounts
} = require('../../redisClient');

let Message, Chat, ChatMessages, User, ChatUsers;

async function initializeModels() {
    try {
        const models = await modelsPromise;
        Message = models.Message;
        Chat = models.Chat;
        ChatMessages = models.ChatMessages;
        User = models.User;
        ChatUsers = models.ChatUsers;
        console.log('Модели успешно загружены в обработчике сообщений');
        return true;
    } catch (error) {
        console.error('Ошибка при инициализации моделей в обработчике сообщений:', error);
        return false;
    }
}

initializeModels();

async function handleMessage(io, msg) {
    if (!Chat || !ChatMessages || !Message || !User || !ChatUsers) {
        console.log('Модели не инициализированы, пытаемся инициализировать...');
        const initialized = await initializeModels();
        if (!initialized || !Chat || !ChatMessages || !Message || !User || !ChatUsers) {
            console.error('Не удалось инициализировать модели');
            io.emit('error', { message: 'Database models are not initialized' });
            return;
        }
    }
    try {
        console.log("Получены данные сообщения:", JSON.stringify(msg));
        
        if (!msg.content || !msg.senderId || !msg.chatId) {
            console.error("Отсутствуют обязательные поля в сообщении", msg);
            return;
        }
        
        if (msg.content.length > process.env.MESSAGE_LENGTH_LIMIT) {
            console.error("Сообщение слишком длинное");
            throw ApiError.badRequest("Message is too long!");
        }
        
        const chat = await Chat.findOne({ where: { id: msg.chatId } });
        if (!chat) {
            console.error("Чат не найден:", msg.chatId);
            return;
        }
            
        const newMessage = {
            content: msg.content,
            senderId: msg.senderId
        };
        
        console.log("Пытаемся создать новое сообщение:", newMessage);
        
        let message;
        try {
            message = await Message.create(newMessage);
            console.log("Создано новое сообщение в базе данных:", message.id);
            
            try {
                await ChatMessages.create({
                    messageId: message.id,
                    chatId: msg.chatId,
                    name: `message-${message.id}`
                });
                console.log("Создана связь сообщения с чатом");
            } catch (chatMessageError) {
                console.error("Ошибка при создании связи сообщения с чатом:", chatMessageError);
            }
            
            // Создаем объект сообщения для хранения в Redis и отправки клиентам
            const messageToCache = {
                id: message.id,
                content: msg.content,
                senderId: msg.senderId,
                timestamp: new Date().toISOString()
            };
            
            // Используем пакетную обработку для Redis-операций
            try {
                await cacheChatMessageBatch(msg.chatId, messageToCache);
            } catch (redisError) {
                console.error("Ошибка при кэшировании сообщения в Redis:", redisError);
            }
            
            // Получаем участников чата для увеличения счетчиков непрочитанных сообщений
            try {
                const chatUsers = await ChatUsers.findAll({
                    where: { chatId: msg.chatId }
                });
                
                if (chatUsers && chatUsers.length > 0) {
                    console.log(`Найдено ${chatUsers.length} участников чата`);
                    
                    // Собираем обновления для пакетной обработки
                    const unreadUpdates = [];
                    
                    // Для каждого участника чата (кроме отправителя) готовим обновления
                    for (const chatUser of chatUsers) {
                        // Получаем ID пользователя из связи
                        let userId;
                        if (chatUser.userId) {
                            userId = chatUser.userId;
                        } else if (chatUser.dataValues && chatUser.dataValues.userId) {
                            userId = chatUser.dataValues.userId;
                        }
                        
                        // Если ID пользователя найден и не равен ID отправителя
                        if (userId && userId !== msg.senderId) {
                            unreadUpdates.push({
                                userId,
                                chatId: msg.chatId,
                                count: 1
                            });
                        }
                    }
                    
                    // Выполняем пакетное обновление счетчиков
                    if (unreadUpdates.length > 0) {
                        try {
                            const results = await batchUpdateUnreadCounts(unreadUpdates);
                            
                            // Отправляем уведомления о новых сообщениях пользователям
                            for (let i = 0; i < unreadUpdates.length; i++) {
                                const { userId, chatId } = unreadUpdates[i];
                                const count = parseInt(results[i]) || 0;
                                
                                io.to(`user:${userId}`).emit('unread_messages_updated', {
                                    chatId,
                                    count
                                });
                            }
                        } catch (batchError) {
                            console.error("Ошибка при пакетном обновлении счетчиков:", batchError);
                        }
                    }
                }
            } catch (chatUsersError) {
                console.error("Ошибка при получении участников чата:", chatUsersError);
            }
        } catch (messageError) {
            console.error("Ошибка при создании сообщения:", messageError);
            return;
        }
        
        let userData = {};
        try {
            const user = await User.findOne({ where: { id: msg.senderId } });
            if (user) {
                userData = {
                    username: user.name,
                    email: user.email
                };
            }
        } catch (userError) {
            console.error('Ошибка при получении данных пользователя:', userError);
            userData = {
                username: msg.username || 'Unknown',
                email: msg.email || ''
            };
        }
        
        const messageToSend = {
            ...msg,
            ...userData,
            id: message.id,
            timestamp: new Date().toISOString()
        };
        
        console.log("Отправка сообщения всем клиентам:", messageToSend);
        io.emit("chatMessage", messageToSend);
    } catch (error) {
        console.error("Ошибка при обработке сообщения: ", error);
    }
}

async function handleJoinRoom(socket, { userId, chatId }) {
    try {
        if (!userId || !chatId) {
            socket.emit('error', { message: 'UserId and chatId are required' });
            return;
        }

        // Присоединяемся к комнате чата
        socket.join(`chat:${chatId}`);
        console.log(`Пользователь ${userId} присоединился к комнате чата ${chatId}`);

        // Сбрасываем счетчик непрочитанных сообщений для этого пользователя в данном чате
        try {
            const resetResult = await resetUnreadMessages(userId, chatId);
            console.log(`Сброшен счетчик непрочитанных сообщений для пользователя ${userId} в чате ${chatId}`);
            
            // Отправляем обновление счетчика клиенту
            socket.emit('unread_messages_updated', {
                chatId: chatId,
                count: 0
            });
        } catch (resetError) {
            console.error(`Ошибка при сбросе счетчика непрочитанных сообщений:`, resetError);
        }
    } catch (error) {
        console.error("Ошибка при присоединении к комнате чата:", error);
        socket.emit('error', { message: 'Failed to join chat room' });
    }
}

module.exports = { handleMessage, handleJoinRoom };
