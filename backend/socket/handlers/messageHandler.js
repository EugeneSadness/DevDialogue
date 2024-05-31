const { Message, Chat, ChatMessages } = require('../../models/models');
const ApiError = require("../../Error/ApiError");
const { json } = require('express');
require("dotenv").config();

async function handleMessage(io, msg) {
    try {
        console.log("Received message data:", msg);
        if(msg.content.length > process.env.MESSAGE_LENGTH_LIMIT){
            throw ApiError.badRequest("Message is too long!");
        }
            
        const newMessage = {
            content: msg.content,
            senderId: msg.senderId
        };
        
        const message = await Message.create(newMessage);
        await ChatMessages.create({
            name: message.content,
            messageId: message.id, 
            chatId: msg.chatId
        });
        io.emit("chatMessage", msg);

            
    } catch (error) {
        console.error("Error handling message: ", error);
    }
}

module.exports = { handleMessage };
