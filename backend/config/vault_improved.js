const vault = require('node-vault');
// Using console for logging instead of a separate logger module

/**
 * Configuration for Vault client
 * Default values are for development
 */
const VAULT_CONFIG = {
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR || 'http://vault:8200',
  token: process.env.VAULT_TOKEN || 'fullstack-root-token'
};

/**
 * Vault client instance
 */
let vaultClient = null;

/**
 * Initialize the Vault client
 * @returns {Object} - The initialized Vault client
 */
const initVault = async () => {
  try {
    if (vaultClient) {
      return vaultClient;
    }

    console.log('Initializing Vault client');
    
    // Create a new Vault client
    vaultClient = vault(VAULT_CONFIG);
    
    try {
      // Verify connection to Vault with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 3000);
      });
      
      const statusPromise = vaultClient.status();
      const status = await Promise.race([statusPromise, timeoutPromise]);
      console.log(`Connected to Vault. Status: ${status.initialized ? 'Initialized' : 'Not Initialized'}`);
    } catch (connError) {
      console.warn(`Could not connect to Vault: ${connError.message}. Will use environment variables as fallback.`);
      // Создаем заглушку вместо реального клиента
      vaultClient = {
        read: () => Promise.reject(new Error('Vault unavailable')),
        write: () => Promise.reject(new Error('Vault unavailable')),
        delete: () => Promise.reject(new Error('Vault unavailable')),
        list: () => Promise.reject(new Error('Vault unavailable')),
        health: () => Promise.reject(new Error('Vault unavailable')),
        status: () => Promise.reject(new Error('Vault unavailable'))
      };
    }
    
    return vaultClient;
  } catch (error) {
    console.error(`Failed to initialize Vault client: ${error.message}`);
    // Создаем заглушку вместо выбрасывания исключения
    vaultClient = {
      read: () => Promise.reject(new Error('Vault unavailable')),
      write: () => Promise.reject(new Error('Vault unavailable')),
      delete: () => Promise.reject(new Error('Vault unavailable')),
      list: () => Promise.reject(new Error('Vault unavailable')),
      health: () => Promise.reject(new Error('Vault unavailable')),
      status: () => Promise.reject(new Error('Vault unavailable'))
    };
    return vaultClient;
  }
};

/**
 * Read a secret from Vault
 * @param {string} path - Path to the secret
 * @param {string} key - Optional key within the secret
 * @returns {Promise<any>} - The secret value
 */
const readSecret = async (path, key = null) => {
  try {
    // Ensure Vault client is initialized
    const client = await initVault();
    
    // Adjust path if needed
    let adjustedPath = path;
    console.log(`Чтение секрета из Vault по пути: ${path}`);
    
    // Check if path already has a proper prefix
    if (!path.startsWith('secret/') && !path.startsWith('secret/data/')) {
      // Try with proper prefix for KV v2
      adjustedPath = `secret/data/${path}`;
      console.log(`Попытка чтения секрета по пути: ${adjustedPath}`);
    }
    
    try {
      // Read secret from the adjusted path
      const { data } = await client.read(adjustedPath);
      
      // If key is specified, return only that key's value
      if (key && data && data.data) {
        return data.data[key];
      }
      
      // Otherwise return all data
      return data;
    } catch (firstError) {
      // If the adjusted path failed and we added a prefix, try without the prefix
      if (adjustedPath !== path) {
        console.log(`Не удалось прочитать секрет с префиксом, пробуем без него: ${path}`);
        const { data } = await client.read(path);
        
        // If key is specified, return only that key's value
        if (key && data && data.data) {
          return data.data[key];
        }
        
        // Otherwise return all data
        return data;
      }
      
      // If we're reading from a path starting with secret/ but not secret/data/, try with data/
      if (path.startsWith('secret/') && !path.startsWith('secret/data/')) {
        const dataPath = path.replace('secret/', 'secret/data/');
        console.log(`Пробуем с путем для KV v2: ${dataPath}`);
        const { data } = await client.read(dataPath);
        
        // If key is specified, return only that key's value
        if (key && data && data.data) {
          return data.data[key];
        }
        
        // Otherwise return all data
        return data;
      }
      
      // If all attempts have failed, re-throw the original error
      throw firstError;
    }
  } catch (error) {
    console.error(`Failed to read secret from ${path}: ${error.message}`);
    
    // Проверяем, есть ли переменная окружения с таким же именем
    if (key && path.includes('/')) {
      const envKey = path.split('/').pop().toUpperCase() + '_' + key.toUpperCase();
      console.log(`Trying to use environment variable ${envKey} as fallback`);
      
      if (process.env[envKey]) {
        console.log(`Using environment variable ${envKey} as fallback`);
        return process.env[envKey];
      }
    }
    
    // Если это JWT секрет, пробуем использовать JWT_SECRET из переменных окружения
    if (path.includes('jwt') && key === 'secret' && process.env.JWT_SECRET) {
      console.log('Using JWT_SECRET environment variable as fallback');
      return process.env.JWT_SECRET;
    }
    
    throw new Error(`Failed to read secret: ${error.message}`);
  }
};

/**
 * Write a secret to Vault
 * @param {string} path - Path to store the secret
 * @param {Object} data - Data to store
 * @returns {Promise<Object>} - Result of the write operation
 */
const writeSecret = async (path, data) => {
  try {
    // Ensure Vault client is initialized
    const client = await initVault();
    
    // Adjust path if needed for KV v2
    let adjustedPath = path;
    if (!path.startsWith('secret/') && !path.startsWith('secret/data/')) {
      adjustedPath = `secret/data/${path}`;
      console.log(`Adjusting path for KV v2: ${adjustedPath}`);
    }
    
    // Write the secret
    const result = await client.write(adjustedPath, { data });
    console.log(`Secret written to ${adjustedPath}`);
    
    return result;
  } catch (error) {
    console.error(`Failed to write secret to ${path}: ${error.message}`);
    // Для записи не используем fallback, просто логируем ошибку
    throw new Error(`Failed to write secret: ${error.message}`);
  }
};

/**
 * Delete a secret from Vault
 * @param {string} path - Path to the secret
 * @returns {Promise<Object>} - Result of the delete operation
 */
const deleteSecret = async (path) => {
  try {
    // Ensure Vault client is initialized
    const client = await initVault();
    
    // Adjust path if needed for KV v2
    let adjustedPath = path;
    if (!path.startsWith('secret/') && !path.startsWith('secret/data/')) {
      adjustedPath = `secret/data/${path}`;
      console.log(`Adjusting path for KV v2: ${adjustedPath}`);
    }
    
    // Delete the secret
    const result = await client.delete(adjustedPath);
    console.log(`Secret deleted from ${adjustedPath}`);
    
    return result;
  } catch (error) {
    console.error(`Failed to delete secret from ${path}: ${error.message}`);
    // Для удаления не используем fallback, просто логируем ошибку
    throw new Error(`Failed to delete secret: ${error.message}`);
  }
};

/**
 * List secrets at a particular path
 * @param {string} path - Path to list secrets from
 * @returns {Promise<Array>} - List of secrets
 */
const listSecrets = async (path) => {
  try {
    // Ensure Vault client is initialized
    const client = await initVault();
    
    // Adjust path if needed
    let adjustedPath = path;
    if (!path.startsWith('secret/') && !path.startsWith('secret/data/')) {
      adjustedPath = `secret/${path}`;
      console.log(`Adjusting path for listing: ${adjustedPath}`);
    }
    
    // List requires the metadata path format for KV v2
    if (adjustedPath.startsWith('secret/data/')) {
      adjustedPath = adjustedPath.replace('secret/data/', 'secret/metadata/');
    }
    
    try {
      // List secrets at adjusted path
      const { data } = await client.list(adjustedPath);
      return data?.keys || [];
    } catch (firstError) {
      // If that fails, try with the original path
      if (adjustedPath !== path) {
        console.log(`Listing failed with adjusted path, trying original: ${path}`);
        const { data } = await client.list(path);
        return data?.keys || [];
      }
      throw firstError;
    }
  } catch (error) {
    console.error(`Failed to list secrets at ${path}: ${error.message}`);
    // Для списка не используем fallback, просто возвращаем пустой массив
    return [];
  }
};

/**
 * Get Vault health status
 * @returns {Promise<Object>} - Vault health status
 */
const getHealthStatus = async () => {
  try {
    // Ensure Vault client is initialized
    const client = await initVault();
    
    // Get status
    return await client.health();
  } catch (error) {
    console.error(`Failed to get Vault health status: ${error.message}`);
    // Возвращаем базовый статус, если Vault недоступен
    return {
      initialized: false,
      sealed: true,
      standby: true,
      performance_standby: false,
      replication_performance_mode: "disabled",
      replication_dr_mode: "disabled",
      server_time_utc: Math.floor(Date.now() / 1000),
      version: "unknown",
      cluster_name: "unknown",
      cluster_id: "unknown"
    };
  }
};

module.exports = {
  // Original function exports
  initVault,
  readSecret,
  writeSecret,
  deleteSecret,
  listSecrets,
  getHealthStatus,
  getClient: () => vaultClient,
  
  // Aliases for backward compatibility
  init: initVault,       // Alias for initVault
  read: readSecret,      // Alias for readSecret
  write: writeSecret,    // Alias for writeSecret
  delete: deleteSecret,  // Alias for deleteSecret
  list: listSecrets,     // Alias for listSecrets
  getHealth: getHealthStatus, // Alias for getHealthStatus
  
  // Additional convenience methods that match how they might be used
  client: () => vaultClient
};
