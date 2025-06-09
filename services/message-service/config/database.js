const { Sequelize } = require('sequelize');
const { initMessageModel } = require('../models/Message');
const { initChatModel } = require('../models/Chat');
const { initChatMemberModel } = require('../models/ChatMember');

let sequelize;

const connectDB = async () => {
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'message_db',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'password',
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 20,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      retry: {
        max: 3
      }
    };

    sequelize = new Sequelize(dbConfig);

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Message Service database connection established successfully');

    // Initialize models
    const Message = initMessageModel(sequelize);
    const Chat = initChatModel(sequelize);
    const ChatMember = initChatMemberModel(sequelize);
    
    // Define associations
    Chat.hasMany(Message, { foreignKey: 'chatId', as: 'messages' });
    Message.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });
    
    Chat.hasMany(ChatMember, { foreignKey: 'chatId', as: 'members' });
    ChatMember.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });
    
    console.log('✅ Message Service models initialized');

    // Sync models (in production, use migrations instead)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized');
    }

    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to message database:', error);
    throw error;
  }
};

const getDB = () => {
  if (!sequelize) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return sequelize;
};

module.exports = {
  connectDB,
  getDB
};
