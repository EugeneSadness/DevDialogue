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
    
    // Verify connection to Vault
    const status = await vaultClient.status();
    console.log(`Connected to Vault. Status: ${status.initialized ? 'Initialized' : 'Not Initialized'}`);
    
    return vaultClient;
  } catch (error) {
    console.error(`Failed to initialize Vault client: ${error.message}`);
    throw new Error(`Vault initialization failed: ${error.message}`);
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
    
    // Read secret from the specified path
    const { data } = await client.read(path);
    
    // If key is specified, return only that key's value
    if (key && data && data.data) {
      return data.data[key];
    }
    
    // Otherwise return all data
    return data;
  } catch (error) {
    console.error(`Failed to read secret from ${path}: ${error.message}`);
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
    
    // Write the secret
    const result = await client.write(path, { data });
    console.log(`Secret written to ${path}`);
    
    return result;
  } catch (error) {
    console.error(`Failed to write secret to ${path}: ${error.message}`);
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
    
    // Delete the secret
    const result = await client.delete(path);
    console.log(`Secret deleted from ${path}`);
    
    return result;
  } catch (error) {
    console.error(`Failed to delete secret from ${path}: ${error.message}`);
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
    
    // List secrets at path
    const { data } = await client.list(path);
    
    return data?.keys || [];
  } catch (error) {
    console.error(`Failed to list secrets at ${path}: ${error.message}`);
    throw new Error(`Failed to list secrets: ${error.message}`);
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
    throw new Error(`Failed to get Vault health status: ${error.message}`);
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
