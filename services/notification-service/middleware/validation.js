const validateNotification = (req, res, next) => {
  const { userId, title, body, type = 'message', priority = 'normal' } = req.body;
  const errors = [];

  // Validate userId (for internal API calls)
  if (userId !== undefined && (!Number.isInteger(Number(userId)) || Number(userId) <= 0)) {
    errors.push('Valid user ID is required');
  }

  // Validate title
  if (!title || title.trim().length === 0) {
    errors.push('Notification title is required');
  } else if (title.length > 255) {
    errors.push('Notification title cannot exceed 255 characters');
  }

  // Validate body
  if (!body || body.trim().length === 0) {
    errors.push('Notification body is required');
  } else if (body.length > 1000) {
    errors.push('Notification body cannot exceed 1000 characters');
  }

  // Validate type
  const validTypes = ['message', 'chat_invite', 'system', 'reminder'];
  if (!validTypes.includes(type)) {
    errors.push('Invalid notification type');
  }

  // Validate priority
  const validPriorities = ['low', 'normal', 'high', 'urgent'];
  if (!validPriorities.includes(priority)) {
    errors.push('Invalid notification priority');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateSubscription = (req, res, next) => {
  const { subscription } = req.body;
  const errors = [];

  // Validate subscription object
  if (!subscription || typeof subscription !== 'object') {
    errors.push('Subscription object is required');
  } else {
    // Validate endpoint
    if (!subscription.endpoint || typeof subscription.endpoint !== 'string') {
      errors.push('Valid subscription endpoint is required');
    } else {
      try {
        new URL(subscription.endpoint);
      } catch (e) {
        errors.push('Subscription endpoint must be a valid URL');
      }
    }

    // Validate keys
    if (!subscription.keys || typeof subscription.keys !== 'object') {
      errors.push('Subscription keys are required');
    } else {
      if (!subscription.keys.p256dh || typeof subscription.keys.p256dh !== 'string') {
        errors.push('Valid p256dh key is required');
      }

      if (!subscription.keys.auth || typeof subscription.keys.auth !== 'string') {
        errors.push('Valid auth key is required');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validatePreferences = (req, res, next) => {
  const { preferences } = req.body;
  const errors = [];

  if (!preferences || typeof preferences !== 'object') {
    errors.push('Preferences object is required');
  } else {
    const validPreferenceKeys = ['messages', 'chatInvites', 'system', 'reminders'];
    
    for (const [key, value] of Object.entries(preferences)) {
      if (!validPreferenceKeys.includes(key)) {
        errors.push(`Invalid preference key: ${key}`);
      } else if (typeof value !== 'boolean') {
        errors.push(`Preference ${key} must be a boolean value`);
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validatePagination = (req, res, next) => {
  const { limit, offset } = req.query;
  const errors = [];

  // Validate limit
  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum <= 0 || limitNum > 100) {
      errors.push('Limit must be a positive integer between 1 and 100');
    }
  }

  // Validate offset
  if (offset !== undefined) {
    const offsetNum = Number(offset);
    if (!Number.isInteger(offsetNum) || offsetNum < 0) {
      errors.push('Offset must be a non-negative integer');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateBulkNotification = (req, res, next) => {
  const { userIds } = req.body;
  const errors = [];

  // Validate userIds array
  if (!Array.isArray(userIds)) {
    errors.push('userIds must be an array');
  } else if (userIds.length === 0) {
    errors.push('userIds array cannot be empty');
  } else if (userIds.length > 1000) {
    errors.push('Cannot send to more than 1000 users at once');
  } else {
    // Validate each userId
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
        errors.push(`Invalid user ID at index ${i}: ${userId}`);
        break; // Stop after first invalid ID to avoid spam
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  // Continue with regular notification validation
  validateNotification(req, res, next);
};

module.exports = {
  validateNotification,
  validateSubscription,
  validatePreferences,
  validatePagination,
  validateBulkNotification
};
