const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const vault = require('./config/vault');

// Load environment variables as fallback
dotenv.config();

// Initialize database connection with credentials from Vault
async function initializeDb() {
  let sequelize;
  let usingVault = false;
  
  try {
    // Попытка инициализации Vault с увеличенным таймаутом
    const vaultInitPromise = vault.initVault();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Vault initialization timeout')), 10000);
    });
    
    try {
      await Promise.race([vaultInitPromise, timeoutPromise]);
      
      // Получение учетных данных базы данных из Vault
      console.log('Fetching database credentials from Vault...');
      
      // Пробуем получить секреты из Vault по пути secret/app/database
      console.log('Trying to read secret from path: secret/app/database');
      let dbSecrets;
      
      try {
        // Прямой запрос к Vault с использованием node-vault
        const client = await vault.getClient();
        const result = await client.read('secret/data/app/database');
        console.log('Successfully retrieved secrets directly from Vault API');
        dbSecrets = result;
      } catch (directError) {
        console.log(`Failed to retrieve secrets directly: ${directError.message}`);
        
        try {
          // Пробуем через наш метод readSecret
          dbSecrets = await vault.readSecret('secret/app/database');
          console.log('Successfully retrieved secrets from secret/app/database');
        } catch (error) {
          console.log(`Failed to retrieve secrets from 'secret/app/database': ${error.message}`);
          
          // Если не удалось, пробуем путь без префикса
          try {
            console.log('Trying to read secret from path: app/database');
            dbSecrets = await vault.readSecret('app/database');
            console.log('Successfully retrieved secrets from app/database');
          } catch (appPathError) {
            console.log(`Failed to retrieve secrets from 'app/database': ${appPathError.message}`);
            
            // В последнюю очередь пробуем с префиксом 'kv/data/'
            console.log('Trying to read secret from path: kv/data/app/database');
            dbSecrets = await vault.readSecret('kv/data/app/database');
            console.log('Successfully retrieved secrets from kv/data/app/database');
          }
        }
      }
      
      // Извлекаем данные из ответа Vault
      console.log('Получены секреты из Vault:', dbSecrets);
      
      // Обрабатываем разные форматы ответа Vault
      let dbCredentials = {};
      if (dbSecrets && dbSecrets.data && dbSecrets.data.data) {
        // Формат для Vault KV v2
        dbCredentials = dbSecrets.data.data;
      } else if (dbSecrets && dbSecrets.data) {
        // Формат для Vault KV v1
        dbCredentials = dbSecrets.data;
      } else {
        // Если формат не распознан, используем весь объект
        dbCredentials = dbSecrets || {};  
      }
      
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
      
      usingVault = true;
      console.log('Database connection established using Vault credentials');
    } catch (vaultError) {
      throw new Error(`Vault error: ${vaultError.message}`);
    }
  } catch (error) {
    console.error('Failed to initialize Vault or get credentials:', error.message);
    console.log('Falling back to environment variables for database connection');
    console.log('Note: If using Vault, make sure secrets are stored at "secret/app/database"');
    
    // Проверка наличия необходимых переменных окружения
    if (!process.env.DB_NAME || !process.env.DB_USER) {
      console.error('Missing required environment variables for database connection');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('DB_')));
    }
    
    // Fallback to environment variables if Vault is not available
    sequelize = new Sequelize(
      process.env.DB_NAME || 'test_messenger',
      process.env.DB_USER || 'eugene',
      process.env.DB_PASSWORD || 'king5681',
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
