const { Sequelize } = require('sequelize');
const { initUserModel } = require('../models/User');

let sequelize;

const connectDB = async () => {
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'auth_db',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'password',
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
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
    console.log('✅ Auth Service database connection established successfully');

    // Initialize models
    initUserModel(sequelize);
    console.log('✅ User model initialized');

    // Sync models (in production, use migrations instead)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized');
    }

    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to auth database:', error);
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
