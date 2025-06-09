const { logger } = require('./logging');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Axios/HTTP errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Unable to connect to target service',
      service: 'monitoring-service'
    });
  }

  if (err.code === 'ETIMEDOUT') {
    return res.status(504).json({
      error: 'Gateway timeout',
      message: 'Service request timed out',
      service: 'monitoring-service'
    });
  }

  // Prometheus/metrics errors
  if (err.message && err.message.includes('metrics')) {
    return res.status(500).json({
      error: 'Metrics collection error',
      message: 'Failed to collect or process metrics',
      service: 'monitoring-service'
    });
  }

  // JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      service: 'monitoring-service'
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
      service: 'monitoring-service'
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    service: 'monitoring-service',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
