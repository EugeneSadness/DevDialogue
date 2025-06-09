const express = require('express');
const { getMetricsAsJSON, resetMetrics } = require('../services/metricsService');

const router = express.Router();

// Get all metrics in JSON format
router.get('/', async (req, res) => {
  try {
    const metrics = await getMetricsAsJSON();
    
    res.json({
      metrics,
      timestamp: new Date().toISOString(),
      count: metrics.length
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get system metrics summary
router.get('/summary', async (req, res) => {
  try {
    const metrics = await getMetricsAsJSON();
    
    // Extract key metrics
    const summary = {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      http: {
        totalRequests: 0,
        errorRate: 0,
        averageResponseTime: 0
      },
      services: {
        healthy: 0,
        total: 0,
        responseTime: 0
      }
    };
    
    // Process metrics to extract summary data
    metrics.forEach(metric => {
      switch (metric.name) {
        case 'http_requests_total':
          summary.http.totalRequests += metric.values.reduce((sum, val) => sum + val.value, 0);
          break;
        case 'service_health_status':
          metric.values.forEach(val => {
            summary.services.total++;
            if (val.value === 1) summary.services.healthy++;
          });
          break;
        case 'service_response_time_seconds':
          const responseTimes = metric.values.map(val => val.value);
          summary.services.responseTime = responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;
          break;
      }
    });
    
    // Calculate health percentage
    summary.services.healthPercentage = summary.services.total > 0
      ? Math.round((summary.services.healthy / summary.services.total) * 100)
      : 0;
    
    res.json({
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get metrics summary error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get specific metric by name
router.get('/:metricName', async (req, res) => {
  try {
    const { metricName } = req.params;
    const metrics = await getMetricsAsJSON();
    
    const metric = metrics.find(m => m.name === metricName);
    
    if (!metric) {
      return res.status(404).json({
        error: 'Metric not found',
        availableMetrics: metrics.map(m => m.name)
      });
    }
    
    res.json({
      metric,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get specific metric error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get HTTP metrics
router.get('/http/requests', async (req, res) => {
  try {
    const metrics = await getMetricsAsJSON();
    
    const httpMetrics = metrics.filter(m => 
      m.name.startsWith('http_request') || 
      m.name === 'http_requests_total'
    );
    
    res.json({
      httpMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get HTTP metrics error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get service health metrics
router.get('/services/health', async (req, res) => {
  try {
    const metrics = await getMetricsAsJSON();
    
    const serviceMetrics = metrics.filter(m => 
      m.name.startsWith('service_') || 
      m.name === 'errors_total'
    );
    
    res.json({
      serviceMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get service health metrics error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get system resource metrics
router.get('/system/resources', async (req, res) => {
  try {
    const metrics = await getMetricsAsJSON();
    
    const systemMetrics = metrics.filter(m => 
      m.name.includes('memory') || 
      m.name.includes('cpu') ||
      m.name.startsWith('nodejs_') ||
      m.name.startsWith('process_')
    );
    
    res.json({
      systemMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get system metrics error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Reset all metrics (for testing/debugging)
router.post('/reset', (req, res) => {
  try {
    resetMetrics();
    
    res.json({
      message: 'All metrics have been reset',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reset metrics error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get metrics in Prometheus format (alternative endpoint)
router.get('/prometheus', async (req, res) => {
  try {
    const { register } = require('../services/metricsService');
    
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    console.error('Get Prometheus metrics error:', error);
    res.status(500).end(error.message);
  }
});

module.exports = router;
