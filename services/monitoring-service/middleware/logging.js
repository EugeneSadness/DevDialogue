const winston = require('winston');

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'monitoring-service' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

const setupLogging = () => {
  // Create logs directory if it doesn't exist
  const fs = require('fs');
  const path = require('path');
  
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  console.log('✅ Logging configured');
};

// Custom logging functions for monitoring service
const logHealthCheck = (service, status, responseTime, error = null) => {
  const logData = {
    type: 'health_check',
    service,
    status,
    responseTime,
    timestamp: new Date().toISOString()
  };
  
  if (error) {
    logData.error = error;
    logger.error('Health check failed', logData);
  } else {
    logger.info('Health check completed', logData);
  }
};

const logMetricCollection = (metricName, value, labels = {}) => {
  logger.debug('Metric collected', {
    type: 'metric_collection',
    metricName,
    value,
    labels,
    timestamp: new Date().toISOString()
  });
};

const logAlert = (service, severity, message) => {
  logger.warn('Alert generated', {
    type: 'alert',
    service,
    severity,
    message,
    timestamp: new Date().toISOString()
  });
};

const logSystemEvent = (event, details) => {
  logger.info('System event', {
    type: 'system_event',
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  setupLogging,
  logger,
  logHealthCheck,
  logMetricCollection,
  logAlert,
  logSystemEvent
};
