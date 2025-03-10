/**
 * Vault initialization and secrets migration script
 *
 * This script initializes Vault and migrates secrets from environment variables.
 * It should be run once to set up Vault with the necessary secrets.
 *
 * Usage:
 * 1. Make sure Vault is running (via docker-compose up)
 * 2. Run: node config/vault-init.js
 * 3. After successful execution, modify your application to use Vault instead of
 *    direct environment variables or config files
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const vault = require('./vault');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.error('Error loading .env file:', envResult.error);
  process.exit(1);
}

// Load database config from config.json
const configPath = path.resolve(__dirname, './config.json');
let dbConfig;

try {
  const configRaw = fs.readFileSync(configPath, 'utf-8');
  const configJson = JSON.parse(configRaw);
  dbConfig = configJson.development; // Using development config
} catch (error) {
  console.log('No config.json found or invalid format. Will use only .env variables.');
  dbConfig = {};
}
/**
 * Check if a secret exists in Vault
 * @param {string} path - Path to the secret in Vault
 * @returns {Promise<boolean>} - True if secret exists, false otherwise
 */
async function secretExists(path) {
  try {
    const client = vault.getClient();
    await client.read(path);
    return true;
  } catch (error) {
    if (error.response && error.response.statusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Migrate database credentials to Vault
 */
async function migrateDatabaseCredentials() {
  // Prioritize .env variables, fall back to config.json
  const dbCredentials = {
    username: process.env.DB_USER || dbConfig.username,
    password: process.env.DB_PASSWORD || dbConfig.password,
    database: process.env.DB_NAME || dbConfig.database,
    host: process.env.DB_HOST || dbConfig.host || 'localhost',
    port: process.env.DB_PORT || dbConfig.port || 5432
  };

  // Check if any required credentials are missing
  const requiredFields = ['username', 'password', 'database'];
  const missingFields = requiredFields.filter(field => !dbCredentials[field]);
  
  if (missingFields.length > 0) {
    console.error(`Missing required database credentials: ${missingFields.join(', ')}`);
    console.error('Please set them in the .env file or config.json and run this script again.');
    return false;
  }

  try {
    // Check if secrets already exist
    const secretPath = 'kv/data/app/database';
    const exists = await secretExists(secretPath);
    
    if (exists) {
      console.log('Database credentials already exist in Vault.');
      const overwrite = process.env.FORCE_OVERWRITE === 'true';
      if (!overwrite) {
        console.log('Skipping database credentials migration. Set FORCE_OVERWRITE=true to overwrite.');
        return true;
      }
      console.log('Overwriting existing database credentials in Vault...');
    }

    // Write database credentials to Vault
    await vault.writeSecret('kv/data/app/database', {
      data: {
        username: dbCredentials.username,
        password: dbCredentials.password,
        database: dbCredentials.database,
        host: dbCredentials.host,
        port: dbCredentials.port
      }
    });
    console.log('Successfully migrated database credentials to Vault.');
    return true;
  } catch (error) {
    console.error('Failed to migrate database credentials to Vault:', error.message);
    return false;
  }
}

/**
 * Migrate JWT secret to Vault
 */
async function migrateJwtSecret() {
  const jwtSecret = process.env.SECRET_JWT;
  
  if (!jwtSecret) {
    console.error('Missing JWT secret. Please set SECRET_JWT in the .env file and run this script again.');
    return false;
  }

  try {
    // Check if secrets already exist
    const secretPath = 'kv/data/app/jwt';
    const exists = await secretExists(secretPath);
    
    if (exists) {
      console.log('JWT secret already exists in Vault.');
      const overwrite = process.env.FORCE_OVERWRITE === 'true';
      if (!overwrite) {
        console.log('Skipping JWT secret migration. Set FORCE_OVERWRITE=true to overwrite.');
        return true;
      }
      console.log('Overwriting existing JWT secret in Vault...');
    }

    // Write JWT secret to Vault
    await vault.writeSecret('kv/data/app/jwt', {
      data: {
        secret: jwtSecret
      }
    });
    console.log('Successfully migrated JWT secret to Vault.');
    return true;
  } catch (error) {
    console.error('Failed to migrate JWT secret to Vault:', error.message);
    return false;
  }
}

/**
 * Initialize Vault and migrate all secrets
 */
async function initializeVaultAndMigrateSecrets() {
  try {
    console.log('Initializing Vault connection...');
    await vault.initVault();
    
    console.log('Enabling secrets engines...');
    
    // Enable KV secrets engine version 2 if not already enabled
    try {
      await (await vault.getClient()).mount({
        mount_point: 'kv',
        type: 'kv',
        options: {
          version: '2'
        }
      });
      console.log('KV secrets engine v2 enabled at /kv');
    } catch (error) {
      if (error.response && error.response.statusCode === 400) {
        console.log('KV secrets engine already enabled');
      } else {
        throw error;
      }
    }

    // Migrate secrets
    const dbMigrated = await migrateDatabaseCredentials();
    const jwtMigrated = await migrateJwtSecret();

    if (dbMigrated && jwtMigrated) {
      console.log('All secrets successfully migrated to Vault!');
      return true;
    } else {
      console.error('Some secrets could not be migrated to Vault.');
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize Vault:', error.message);
    return false;
  }
}

/**
 * Check if all necessary secrets exist in Vault
 */
async function checkVaultSecrets() {
  try {
    console.log('Checking if necessary secrets exist in Vault...');
    await vault.initVault();
    
    const dbSecretExists = await secretExists('kv/data/app/database');
    const jwtSecretExists = await secretExists('kv/data/app/jwt');

    console.log(`Database credentials: ${dbSecretExists ? 'FOUND' : 'MISSING'}`);
    console.log(`JWT

// Execute the initialization and migration if this script is run directly
if (require.main === module) {
  initializeVaultAndMigrateSecrets()
    .then(success => {
      if (success) {
        console.log('Vault initialization and secret migration completed successfully.');
        process.exit(0);
      } else {
        console.error('Vault initialization or secret migration failed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('An unexpected error occurred:', error);
      process.exit(1);
    });
}

// Export functions for use in other scripts
module.exports = {
  initializeVaultAndMigrateSecrets,
  checkVaultSecrets,
  secretExists
};

/**
 * Vault Initialization Script
 * 
 * This script initializes HashiCorp Vault and stores sensitive configuration data.
 * 
 * Usage:
 * 1. Make sure Vault is running (via docker-compose up)
 * 2. Run: node config/vault-init.js
 * 3. After successful execution, modify your application to use Vault instead of
 *    direct environment variables or config files
 * 
 * Note: This script should be run once during initial setup or when
 * adding new secrets to Vault.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const vault = require('./vault');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.error('Error loading .env file:', envResult.error);
  process.exit(1);
}

// Load database config from config.json
const configPath = path.resolve(__dirname, './config.json');
let dbConfig;

try {
  const configRaw = fs.readFileSync(configPath, 'utf-8');
  const configJson = JSON.parse(configRaw);
  dbConfig = configJson.development; // Using development config
} catch (error) {
  console.error('Error loading config.json:', error);
  process.exit(1);
}

/**
 * Initialize Vault and migrate secrets
 */
async function initializeVault() {
  try {
    console.log('Connecting to Vault...');
    await vault.initVault();
    
    console.log('Enabling secrets engines...');
    
    // Enable KV secrets engine version 2 if not already enabled
    try {
      await (await vault.getClient()).mount({
        mount_point: 'kv',
        type: 'kv',
        options: {
          version: '2'
        }
      });
      console.log('KV secrets engine v2 enabled at /kv');
    } catch (error) {
      if (error.response && error.response.statusCode === 400) {
        console.log('KV secrets engine already enabled');
      } else {
        throw error;
      }
    }

    // Store JWT secret
    const jwtSecret = process.env.SECRET_JWT;
    if (jwtSecret) {
      console.log('Storing JWT secret...');
      await vault.writeSecret('kv/data/app/jwt', {
        data: {
          secret: jwtSecret
        }
      });
      console.log('JWT secret stored successfully');
    } else {
      console.warn('Warning: No JWT secret found in .env file');
    }

    // Store database credentials
    console.log('Storing database credentials...');
    
    // Prioritize .env variables, fall back to config.json
    const dbUser = process.env.DB_USER || dbConfig.username;
    const dbPassword = process.env.DB_PASSWORD || dbConfig.password;
    const dbName = process.env.DB_NAME || dbConfig.database;
    const dbHost = process.env.DB_HOST || dbConfig.host;
    const dbPort = process.env.DB_PORT || dbConfig.port || 5432;
    
    await vault.writeSecret('kv/data/app/database', {
      data: {
        username: dbUser,
        password: dbPassword,
        database: dbName,
        host: dbHost,
        port: dbPort
      }
    });
    console.log('Database credentials stored successfully');

    console.log('\nVault initialization completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your application to fetch secrets from Vault');
    console.log('2. Remove sensitive data from .env and config.json files');
    console.log('3. Consider adding Vault policies for access control');
    
  } catch (error) {
    console.error('Vault initialization failed:', error);
    process.exit(1);
  }
}

// Execute the initialization
initializeVault().catch(err => {
  console.error('Unhandled error during Vault initialization:', err);
  process.exit(1);
});

