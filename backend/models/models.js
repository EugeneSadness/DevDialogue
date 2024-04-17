const sequelize = require('../db');
const {DataTypes} = require('sequelize');

const User = sequelize.define('user',{ 
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    email: {type: DataTypes.STRING,allowNull: false, unique: true},
    password: {type: DataTypes.STRING, allowNull: false},
    profileInfo: {type: DataTypes.STRING}
});

const ChatUsers = sequelize.define('chatUsers',{
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}
});

const UserType = sequelize.define('userType',{
    id: {type: DataTypes.INTEGER, primaryKey: true}
});

const UserFriends = sequelize.define('userFriends', {
    id: {type: DataTypes.INTEGER, primaryKey: true}
});

const Chat = sequelize.define('chat', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    title: {type: DataTypes.STRING, allowNull: false}
});

const ChatMessages = sequelize.define('chatMessages', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, unique: true, allowNull: true}
});

const Message = sequelize.define('message', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    senderId: {type: DataTypes.INTEGER, allowNull: false},
    content: {type: DataTypes.STRING}
});

const MessageFiles = sequelize.define('messageFiles',{
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}
});

const File = sequelize.define('file', {
    path: {type: DataTypes.STRING, unique:true}
});

User.belongsToMany(Chat, {through: ChatUsers});
Chat.belongsToMany( User, {through: ChatUsers});

Message.belongsToMany(File, {through: MessageFiles});
File.belongsToMany(Message, {through: MessageFiles});

Chat.belongsToMany(Message, {through: ChatMessages});
Message.belongsToMany(Chat, {through: ChatMessages});

ChatUsers.belongsTo(UserType, {foreignKey: UserType.id});
UserType.hasMany(ChatUsers, {foreignKey: UserType.id});

module.exports = {
    User, UserType, UserFriends,
    ChatUsers, Chat, Message, ChatMessages,
    MessageFiles, File
};