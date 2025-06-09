const express = require('express');
const {
  checkAllServicesHealth,
  getHealthStatus,
  getOverallHealth,
  getUptimeStats,
  getAlerts
} = require('../services/healthService');

const router = express.Router();

// Get overall system health
router.get('/', async (req, res) => {
  try {
    const overallHealth = getOverallHealth();
    
    // Set appropriate status code based on health
    let statusCode = 200;
    if (overallHealth.status === 'degraded') {
      statusCode = 207; // Multi-Status
    } else if (overallHealth.status === 'critical') {
      statusCode = 503; // Service Unavailable
    }
    
    res.status(statusCode).json(overallHealth);
  } catch (error) {
    console.error('Get overall health error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get detailed health status of all services
router.get('/detailed', async (req, res) => {
  try {
    const healthStatus = getHealthStatus();
    const overallHealth = getOverallHealth();
    const uptimeStats = getUptimeStats();
    const alerts = getAlerts();
    
    res.json({
      overall: overallHealth,
      services: healthStatus,
      uptime: uptimeStats,
      alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get detailed health error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Force health check of all services
router.post('/check', async (req, res) => {
  try {
    const results = await checkAllServicesHealth();
    
    res.json({
      message: 'Health check completed',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Force health check error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get health status of specific service
router.get('/service/:serviceName', (req, res) => {
  try {
    const { serviceName } = req.params;
    const healthStatus = getHealthStatus();
    
    if (!healthStatus[serviceName]) {
      return res.status(404).json({
        error: 'Service not found',
        availableServices: Object.keys(healthStatus)
      });
    }
    
    const serviceHealth = healthStatus[serviceName];
    let statusCode = 200;
    
    if (serviceHealth.status === 'unhealthy') {
      statusCode = 503;
    } else if (serviceHealth.status === 'unknown') {
      statusCode = 202; // Accepted (still checking)
    }
    
    res.status(statusCode).json({
      service: serviceName,
      ...serviceHealth
    });
  } catch (error) {
    console.error('Get service health error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get uptime statistics
router.get('/uptime', (req, res) => {
  try {
    const uptimeStats = getUptimeStats();
    
    res.json({
      uptime: uptimeStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get uptime stats error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get current alerts
router.get('/alerts', (req, res) => {
  try {
    const alerts = getAlerts();
    
    res.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Health check summary for dashboard
router.get('/summary', (req, res) => {
  try {
    const overallHealth = getOverallHealth();
    const alerts = getAlerts();
    const uptimeStats = getUptimeStats();
    
    // Calculate average response time
    const healthStatus = getHealthStatus();
    const responseTimes = Object.values(healthStatus)
      .filter(s => s.responseTime !== null)
      .map(s => s.responseTime);
    
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    
    res.json({
      status: overallHealth.status,
      healthyServices: overallHealth.healthyServices,
      totalServices: overallHealth.totalServices,
      healthPercentage: overallHealth.healthPercentage,
      alertsCount: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      averageResponseTime: avgResponseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get health summary error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
