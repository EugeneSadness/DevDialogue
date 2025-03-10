const sequelizePromise = require('../db');
const { DataTypes } = require('sequelize');

// Модели будут определены после инициализации Sequelize
let User, ChatUsers, UserType, UserFriends, Chat, Friendship, 
    ChatMessages, Message, MessageFiles, File;

// Асинхронная функция для инициализации моделей
async function initModels() {
    try {
        // Ожидаем получения экземпляра Sequelize
        const sequelize = await sequelizePromise;
        
        // Определяем модели
        User = sequelize.define('user', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING, allowNull: false, unique: true },
            email: { type: DataTypes.STRING, allowNull: false, unique: true },
            password: { type: DataTypes.STRING, allowNull: false },
            profileInfo: { type: DataTypes.STRING }
        });

        ChatUsers = sequelize.define('chatUsers', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
        });

        UserType = sequelize.define('userType', {
            id: { type: DataTypes.INTEGER, primaryKey: true }
        });

        UserFriends = sequelize.define('userFriends', {
            id: { type: DataTypes.INTEGER, primaryKey: true }
        });

        Chat = sequelize.define('chat', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            title: { type: DataTypes.STRING, allowNull: false }
        });

        Friendship = sequelize.define('friendship', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            user1Id: { type: DataTypes.INTEGER, allowNull: false },
            user2Id: { type: DataTypes.INTEGER, allowNull: false },
            status: { type: DataTypes.ENUM('pending', 'accepted', 'rejected'), allowNull: false, defaultValue: 'pending' }
        });

        ChatMessages = sequelize.define('chatMessages', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING, unique: false, allowNull: false }
        });

        Message = sequelize.define('message', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            senderId: { type: DataTypes.INTEGER, allowNull: false },
            content: { type: DataTypes.STRING, unique: false }
        });

        MessageFiles = sequelize.define('messageFiles', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
        });

        File = sequelize.define('file', {
            path: { type: DataTypes.STRING, unique: true }
        });

        // Определяем связи между моделями
        User.belongsToMany(Chat, { through: ChatUsers });
        Chat.belongsToMany(User, { through: ChatUsers });

        Message.belongsToMany(File, { through: MessageFiles });
        File.belongsToMany(Message, { through: MessageFiles });

        Chat.belongsToMany(Message, { through: ChatMessages });
        Message.belongsToMany(Chat, { through: ChatMessages });

        ChatUsers.belongsTo(UserType, { foreignKey: UserType.id });
        UserType.hasMany(ChatUsers, { foreignKey: UserType.id });

        console.log('Модели успешно инициализированы');
        
        return {
            User, UserType, UserFriends,
            ChatUsers, Chat, Message, ChatMessages,
            MessageFiles, File, Friendship
        };
    } catch (error) {
        console.error('Ошибка при инициализации моделей:', error);
        throw error;
    }
}

// Экспортируем промис, который разрешается в объект с моделями
module.exports = initModels();