const modelsPromise = require('../../models/models');
const ApiError = require("../../Error/ApiError");
const { json } = require('express');
require("dotenv").config();

let Message, Chat, ChatMessages, User;

async function initializeModels() {
    try {
        const models = await modelsPromise;
        Message = models.Message;
        Chat = models.Chat;
        ChatMessages = models.ChatMessages;
        User = models.User;
        return true;
    } catch (error) {
        console.error('Ошибка при инициализации моделей в обработчике сообщений:', error);
        return false;
    }
}

initializeModels();

async function handleMessage(io, msg) {
    if (!Chat || !ChatMessages || !Message || !User) {
        const initialized = await initializeModels();
        if (!initialized || !Chat || !ChatMessages || !Message || !User) {
            console.error('Не удалось инициализировать модели');
            io.emit('error', { message: 'Database models are not initialized' });
            return;
        }
    }
    try {
        if (!msg.content || !msg.senderId || !msg.chatId) {
            console.error("Отсутствуют обязательные поля в сообщении");
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
        
        let messageId;
        try {
            const message = await Message.create(newMessage);
            messageId = message.id;
            
            try {
                const chatMessage = await ChatMessages.create({
                    messageId: messageId, 
                    chatId: msg.chatId,
                    name: message.content
                });
            } catch (chatMessageError) {
                console.error("Ошибка при создании связи сообщения с чатом:", chatMessageError);
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
            id: messageId,
            timestamp: new Date().toISOString()
        };
        
        io.emit("chatMessage", messageToSend);
    } catch (error) {
        console.error("Ошибка при обработке сообщения: ", error);
    }
}

module.exports = { handleMessage };
