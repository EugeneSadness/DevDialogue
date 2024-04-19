const ApiError = require("../Error/ApiError");
const { Chat, ChatUsers, UserType } = require('../models/models');
const { extractUserDataFromToken } = require("../middleware/tokenService");
require("dotenv").config();

class chatController {
    async createChat(req, res, next) {
        try {
            const { title } = req.body;
            const id = await this.getUserByToken(req);
            const chatCheck = await ChatUsers.findOne({ where: { title: title, userId: id } });
            if (chatCheck !== 0) {
                return next(ApiError.badRequest('Chat with this title was already created!'));
            }
            if (!title) {
                return next(ApiError.badRequest('Chat title is empty!'));
            }
            if (title.length > process.env.CHAT_TITLE_LIMIT) {
                return next(ApiError.badRequest('Title is too long!'));
            }
            const chat = await Chat.create({ title });
            const userType = await UserType.create({ id: process.env.USER_TYPE_CREATOR });
            await ChatUsers.create({ userId: id, chatId: chat.id, userTypeId: userType.id });
            return res.json({ status: 200 });
        } catch (error) {
            console.error("Error creating the chat", error);
            return next(ApiError.internal("Error creating the chat"));
        }
    }
    async deleteChat(req, res, next) {
        try {
            const { chatId } = req.body;
            const id = await this.getUserByToken(req);
            const isCreator = await ChatUsers.findOne({ where: { id: chatId, userId: id, userTypeId: process.env.USER_TYPE_CREATOR } })
            if (isCreator === 0) {
                return next(ApiError.badRequest("User is not the creator!"));
            }
            const deletedChat = await Chat.destroy({ where: { id: chatId } });
            if (deletedChat === 0) {
                return next(ApiError.badRequest("Chat was not found or deleted!"));
            }
            return res.json({ status: 200 });

        } catch (error) {
            console.error("Error deleting the chat", error);
            return next(ApiError.internal("Error deleting the chat"));
        }
    }

    async getChatById(req, res, next) {
        try {
            const id = await this.getUserByToken(req);
            const chatId = req.params.chatid;
            const isExist = await ChatUsers.findOne({ where: { chatId: chatId } });
            if (isExist === 0) {
                return next(ApiError.badRequest("Chat is not exist!"));
            }
            const isMember = await ChatUsers.findOne({ where: { chatId: chatId, userId: id } });
            if (isMember === 0) {
                return next(ApiError.badRequest("User is not the member of current chat"));
            }
            return res.json({ status: 200 });

        } catch (error) {
            console.error("Error getting chat", error);
            return next(ApiError.internal("Error getting chat"));
        }

    }

    async getUserByToken(req, next) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const { id } = extractUserDataFromToken(token);

            return id;

        } catch (error) {
            console.error("Error extracting user data from token:", error);
            return next(ApiError.internal("Error extracting user data from token"));
        }
    }

}

module.exports = new chatController();
