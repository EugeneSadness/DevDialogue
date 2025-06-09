const axios = require('axios');
const { updateServiceHealth, incrementErrorCount } = require('./metricsService');
const { logger } = require('../middleware/logging');

// Service configurations
const services = [
  {
    name: 'auth-service',
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    healthEndpoint: '/health',
    timeout: 5000
  },
  {
    name: 'message-service',
    url: process.env.MESSAGE_SERVICE_URL || 'http://localhost:3002',
    healthEndpoint: '/health',
    timeout: 5000
  },
  {
    name: 'notification-service',
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
    healthEndpoint: '/health',
    timeout: 5000
  }
];

// Store health status
const healthStatus = new Map();

// Initialize health status
services.forEach(service => {
  healthStatus.set(service.name, {
    status: 'unknown',
    lastCheck: null,
    responseTime: null,
    error: null,
    consecutiveFailures: 0
  });
});

// Check health of a single service
const checkServiceHealth = async (service) => {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${service.url}${service.healthEndpoint}`, {
      timeout: service.timeout,
      headers: {
        'User-Agent': 'monitoring-service/1.0.0'
      }
    });
    
    const responseTime = Date.now() - startTime;
    const isHealthy = response.status === 200;
    
    // Update health status
    healthStatus.set(service.name, {
      status: isHealthy ? 'healthy' : 'unhealthy',
      lastCheck: new Date(),
      responseTime,
      error: null,
      consecutiveFailures: isHealthy ? 0 : healthStatus.get(service.name).consecutiveFailures + 1
    });
    
    // Update metrics
    updateServiceHealth(service.name, service.healthEndpoint, isHealthy, responseTime);
    
    if (isHealthy) {
      logger.debug(`✅ ${service.name} is healthy (${responseTime}ms)`);
    } else {
      logger.warn(`⚠️ ${service.name} returned status ${response.status}`);
      incrementErrorCount(service.name, 'health_check_failed', service.healthEndpoint);
    }
    
    return {
      service: service.name,
      healthy: isHealthy,
      responseTime,
      status: response.status,
      data: response.data
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Update health status
    const currentStatus = healthStatus.get(service.name);
    healthStatus.set(service.name, {
      status: 'unhealthy',
      lastCheck: new Date(),
      responseTime,
      error: error.message,
      consecutiveFailures: currentStatus.consecutiveFailures + 1
    });
    
    // Update metrics
    updateServiceHealth(service.name, service.healthEndpoint, false, responseTime);
    incrementErrorCount(service.name, 'health_check_error', service.healthEndpoint);
    
    logger.error(`❌ ${service.name} health check failed: ${error.message}`);
    
    return {
      service: service.name,
      healthy: false,
      responseTime,
      error: error.message,
      code: error.code
    };
  }
};

// Check health of all services
const checkAllServicesHealth = async () => {
  const results = [];
  
  for (const service of services) {
    const result = await checkServiceHealth(service);
    results.push(result);
  }
  
  return results;
};

// Get current health status
const getHealthStatus = () => {
  const status = {};
  
  healthStatus.forEach((value, key) => {
    status[key] = value;
  });
  
  return status;
};

// Get overall system health
const getOverallHealth = () => {
  const statuses = Array.from(healthStatus.values());
  const healthyServices = statuses.filter(s => s.status === 'healthy').length;
  const totalServices = statuses.length;
  
  let overallStatus = 'healthy';
  if (healthyServices === 0) {
    overallStatus = 'critical';
  } else if (healthyServices < totalServices) {
    overallStatus = 'degraded';
  }
  
  return {
    status: overallStatus,
    healthyServices,
    totalServices,
    healthPercentage: Math.round((healthyServices / totalServices) * 100),
    lastUpdate: new Date(),
    services: getHealthStatus()
  };
};

// Start periodic health checks
const startHealthChecks = () => {
  // Initial health check
  checkAllServicesHealth();
  
  // Schedule periodic checks every 30 seconds
  setInterval(async () => {
    try {
      await checkAllServicesHealth();
    } catch (error) {
      logger.error('Error during health checks:', error);
    }
  }, 30000);
  
  logger.info('🔍 Health monitoring started for all services');
};

// Get service uptime statistics
const getUptimeStats = () => {
  const stats = {};
  
  healthStatus.forEach((value, key) => {
    const uptime = value.status === 'healthy' ? 100 : 0;
    stats[key] = {
      uptime: `${uptime}%`,
      lastCheck: value.lastCheck,
      responseTime: value.responseTime,
      consecutiveFailures: value.consecutiveFailures
    };
  });
  
  return stats;
};

// Check if service is critical (multiple consecutive failures)
const isCritical = (serviceName) => {
  const status = healthStatus.get(serviceName);
  return status && status.consecutiveFailures >= 3;
};

// Get alerts for unhealthy services
const getAlerts = () => {
  const alerts = [];
  
  healthStatus.forEach((value, key) => {
    if (value.status === 'unhealthy') {
      alerts.push({
        service: key,
        severity: isCritical(key) ? 'critical' : 'warning',
        message: value.error || 'Service is unhealthy',
        consecutiveFailures: value.consecutiveFailures,
        lastCheck: value.lastCheck
      });
    }
  });
  
  return alerts;
};

module.exports = {
  checkServiceHealth,
  checkAllServicesHealth,
  getHealthStatus,
  getOverallHealth,
  startHealthChecks,
  getUptimeStats,
  getAlerts,
  isCritical
};
