const ApiError = require("../Error/ApiError");
const router = require("../routes");
const {Message} = require('../models/models');
const { json } = require("sequelize");
const jwt = require('jsonwebtoken');
const tokenService = require('../middleware/tokenService');

class messageController {
    async enterMessage(req, res, next) {
        const { content } = req.body;
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = tokenService.extractUserDataFromToken(token);
        const senderId = decodedToken.id;

        if (!content) {
            return next(ApiError.badRequest('Message is empty!'));
        }

        if (content.length > 200) {
            return next(ApiError.badRequest('Message is too long!'));
        }

        const message = await Message.create({ content, senderId });
        return res.json({ status: 200 });
    }
}

module.exports = new messageController();
