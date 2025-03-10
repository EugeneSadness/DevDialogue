const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const vault = require('./config/vault');

// Load environment variables as fallback
dotenv.config();

// Initialize database connection with credentials from Vault
async function initializeDb() {
  let sequelize;
  
  try {
    // Initialize Vault
    await vault.initVault();
    
    // Retrieve database credentials from Vault
    console.log('Fetching database credentials from Vault...');
    const dbSecrets = await vault.readSecret('kv/data/app/database');
    
    // Extract data from Vault's response format
    const dbCredentials = dbSecrets.data || {};
    
    // Create Sequelize instance with credentials from Vault
    sequelize = new Sequelize(
      dbCredentials.database || process.env.DB_NAME,
      dbCredentials.username || process.env.DB_USER,
      dbCredentials.password || process.env.DB_PASSWORD,
      {
        host: dbCredentials.host || process.env.DB_HOST || 'localhost',
        port: dbCredentials.port || process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
    
    console.log('Database connection established using Vault credentials');
  } catch (error) {
    console.error('Failed to initialize Vault or get credentials:', error.message);
    console.log('Falling back to environment variables for database connection');
    
    // Fallback to environment variables if Vault is not available
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  }
  
  // Test connection
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  
  return sequelize;
}

// Export a promise that resolves to the initialized Sequelize instance
module.exports = initializeDb();
