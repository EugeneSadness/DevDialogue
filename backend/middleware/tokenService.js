const jwt = require('jsonwebtoken');
require("dotenv").config();

function extractUserDataFromToken(token) {
    try {
        const decoded = jwt.verify(token, "random_secret");
        return decoded;
    } catch (error) {
        return null; // Обработка ошибок при расшифровке токена
    }
}

module.exports = {
    extractUserDataFromToken
};