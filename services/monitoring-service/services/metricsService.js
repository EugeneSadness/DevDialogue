const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({
  register,
  prefix: 'monitoring_service_'
});

// Custom metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

const serviceHealthStatus = new client.Gauge({
  name: 'service_health_status',
  help: 'Health status of services (1 = healthy, 0 = unhealthy)',
  labelNames: ['service', 'endpoint'],
  registers: [register]
});

const serviceResponseTime = new client.Gauge({
  name: 'service_response_time_seconds',
  help: 'Response time of services in seconds',
  labelNames: ['service', 'endpoint'],
  registers: [register]
});

const activeConnections = new client.Gauge({
  name: 'active_connections_total',
  help: 'Number of active connections',
  labelNames: ['service'],
  registers: [register]
});

const databaseConnections = new client.Gauge({
  name: 'database_connections_total',
  help: 'Number of database connections',
  labelNames: ['service', 'database'],
  registers: [register]
});

const errorRate = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['service', 'type', 'endpoint'],
  registers: [register]
});

const memoryUsage = new client.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['service', 'type'],
  registers: [register]
});

const cpuUsage = new client.Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage',
  labelNames: ['service'],
  registers: [register]
});

// Middleware to collect HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode, 'monitoring-service')
      .inc();
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode, 'monitoring-service')
      .observe(duration);
  });
  
  next();
};

// Setup metrics collection
const setupMetrics = (app) => {
  // Add metrics middleware
  app.use(metricsMiddleware);
  
  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (error) {
      res.status(500).end(error.message);
    }
  });
  
  // Update system metrics periodically
  setInterval(() => {
    updateSystemMetrics();
  }, 10000); // Every 10 seconds
  
  console.log('✅ Prometheus metrics configured');
};

// Update system metrics
const updateSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  
  memoryUsage
    .labels('monitoring-service', 'rss')
    .set(memUsage.rss);
  
  memoryUsage
    .labels('monitoring-service', 'heapUsed')
    .set(memUsage.heapUsed);
  
  memoryUsage
    .labels('monitoring-service', 'heapTotal')
    .set(memUsage.heapTotal);
  
  memoryUsage
    .labels('monitoring-service', 'external')
    .set(memUsage.external);
  
  // CPU usage (simplified)
  const cpuUsageValue = process.cpuUsage();
  cpuUsage
    .labels('monitoring-service')
    .set((cpuUsageValue.user + cpuUsageValue.system) / 1000000); // Convert to seconds
};

// Functions to update metrics from external sources
const updateServiceHealth = (service, endpoint, isHealthy, responseTime) => {
  serviceHealthStatus
    .labels(service, endpoint)
    .set(isHealthy ? 1 : 0);
  
  if (responseTime !== undefined) {
    serviceResponseTime
      .labels(service, endpoint)
      .set(responseTime / 1000); // Convert to seconds
  }
};

const incrementErrorCount = (service, errorType, endpoint) => {
  errorRate
    .labels(service, errorType, endpoint)
    .inc();
};

const updateActiveConnections = (service, count) => {
  activeConnections
    .labels(service)
    .set(count);
};

const updateDatabaseConnections = (service, database, count) => {
  databaseConnections
    .labels(service, database)
    .set(count);
};

// Get current metrics as JSON
const getMetricsAsJSON = async () => {
  try {
    const metrics = await register.getMetricsAsJSON();
    return metrics;
  } catch (error) {
    console.error('Error getting metrics as JSON:', error);
    return [];
  }
};

// Reset all metrics
const resetMetrics = () => {
  register.resetMetrics();
};

module.exports = {
  setupMetrics,
  updateServiceHealth,
  incrementErrorCount,
  updateActiveConnections,
  updateDatabaseConnections,
  getMetricsAsJSON,
  resetMetrics,
  register
};
