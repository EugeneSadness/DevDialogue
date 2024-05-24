const ApiError = require("../Error/ApiError");
const { Chat, ChatUsers, UserType, User } = require('../models/models');
const { extractUserDataFromToken } = require("../middleware/tokenService");
require("dotenv").config();

class chatController {

    constructor() {
        this.createChat = this.createChat.bind(this);
        this.deleteChat = this.deleteChat.bind(this);
        this.getChatById = this.getChatById.bind(this);
        this.getUserChats = this.getUserChats.bind(this);
        this.getUserByToken = this.getUserByToken.bind(this);
    };

    async createChat(req, res, next) {
        try {
            const { title } = req.body;
            const id = await this.getUserByToken(req);
            if (!title) {
                return next(ApiError.badRequest('Chat title is empty!'));
            }
            if (title.length > process.env.CHAT_TITLE_LIMIT) {
                return next(ApiError.badRequest('Title is too long!'));
            }
            const chat = await Chat.create({ title: title });
            const checkType = await UserType.findOne({where:{id: process.env.USER_TYPE_CREATOR}});
            if(!checkType){
                await UserType.create({id: process.env.USER_TYPE_CREATOR});
            }
            await ChatUsers.create({ userId: id, chatId: chat.id, userTypeId: process.env.USER_TYPE_CREATOR });
            return res.json({ status: 200, id: chat.id });
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

    async getUserChats(req, res, next) {
        try {
            const userIdPromise = this.getUserByToken(req);
            const userId = await userIdPromise;

            const userChats = await ChatUsers.findAll({
                where: { userId: userId },
            });

            const chatIds = userChats.map(userChat => userChat.chatId);

            const chats = await Chat.findAll({
                where: { id: chatIds },
            });

            const formattedChats = chats.map(chat => ({
                id: chat.id,
                text: chat.title
            }));

            return res.status(200).json(formattedChats);
        } catch (error) {
            console.error("Error retrieving all chats", error);
            return next(ApiError.internal("Error retrieving all chats"));
        }

    }

    async getUserByToken(req) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const { id } = extractUserDataFromToken(token);
            return id;
        } catch (error) {
            console.error("Error extracting user data from token:", error);
            throw new ApiError(500, "Error extracting user data from token");
        }
    }

    async addUserToChat(req, res, next){
        try{
            const {chatId, recieverId, inviterId} = req.body;
            const checkChat = await Chat.findOne({id:chatId });
            if(!checkChat){
                return next(ApiError.internal("Chat wasnt found"));
            }
            const isInviterExistsInChat = await ChatUsers.findOne({where: {chatId: chatId, userId: inviterId}});
            if(!isInviterExistsInChat){
                return next(ApiError.internal("Inviter wasnt found"));
            }
            const isRecieverExistsInChat = await ChatUsers.findOne({where: {chatId: chatId, userId: recieverId}});
            if(isRecieverExistsInChat){
                return next(ApiError.badRequest("Reciever already in chat"));
            }
            const checkType = await UserType.findOne({where:{id: process.env.USER_TYPE_MEMBER}});
            if(!checkType){
                await UserType.create({id: process.env.USER_TYPE_MEMBER});
            }
            await ChatUsers.create({ userId: recieverId, chatId: chatId, userTypeId: process.env.USER_TYPE_MEMBER });
            return res.json({status: 200});
        } catch (error) {
            console.error("Error adding member", error);
            return res(ApiError.internal("Error adding member"));
        }
    }
}

module.exports = new chatController();
