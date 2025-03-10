const { Message, Chat, ChatMessages, User } = require('../../models/models');
const ApiError = require("../../Error/ApiError");
const { json } = require('express');
require("dotenv").config();

async function handleMessage(io, msg) {
    try {
        console.log("Получены данные сообщения:", JSON.stringify(msg));
        
        // Проверка наличия обязательных полей
        if (!msg.content || !msg.senderId || !msg.chatId) {
            console.error("Отсутствуют обязательные поля в сообщении", msg);
            return;
        }
        
        // Проверка длины сообщения
        if (msg.content.length > process.env.MESSAGE_LENGTH_LIMIT) {
            console.error("Сообщение слишком длинное");
            throw ApiError.badRequest("Message is too long!");
        }
        
        // Проверка существования чата
        const chat = await Chat.findOne({ where: { id: msg.chatId } });
        if (!chat) {
            console.error("Чат не найден:", msg.chatId);
            return;
        }
            
        // Создание нового сообщения
        const newMessage = {
            content: msg.content,
            senderId: msg.senderId
        };
        
        const message = await Message.create(newMessage);
        console.log("Создано новое сообщение в базе данных:", message.id);
        
        // Связывание сообщения с чатом
        await ChatMessages.create({
            name: message.content,
            messageId: message.id, 
            chatId: msg.chatId
        });
        
        // Получаем дополнительную информацию о пользователе
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
        
        // Добавляем дополнительные поля для отправки
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

module.exports = { handleMessage };
