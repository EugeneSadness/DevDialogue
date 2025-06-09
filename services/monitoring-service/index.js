const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cron = require('node-cron');
require('dotenv').config();

const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');
const { setupMetrics } = require('./services/metricsService');
const { startHealthChecks } = require('./services/healthService');
const { setupLogging } = require('./middleware/logging');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3004;

// Setup logging
setupLogging();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup Prometheus metrics
setupMetrics(app);

// Health check endpoint for this service
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'monitoring-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/metrics', metricsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    service: 'monitoring-service'
  });
});

// Schedule health checks (every 30 seconds)
cron.schedule('*/30 * * * * *', () => {
  // Health checks are handled by the health service
});

// Schedule metrics collection (every minute)
cron.schedule('* * * * *', () => {
  // Metrics collection happens automatically via Prometheus
});

// Start server
async function startServer() {
  try {
    // Start health monitoring
    startHealthChecks();
    console.log('✅ Health monitoring started');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Monitoring Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
      console.log(`🔍 Monitoring services:`);
      console.log(`   - Auth Service: ${process.env.AUTH_SERVICE_URL}`);
      console.log(`   - Message Service: ${process.env.MESSAGE_SERVICE_URL}`);
      console.log(`   - Notification Service: ${process.env.NOTIFICATION_SERVICE_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start monitoring service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;
