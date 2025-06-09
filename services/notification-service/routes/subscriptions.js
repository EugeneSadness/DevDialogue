const express = require('express');
const { getSubscriptionModel } = require('../models/Subscription');
const authMiddleware = require('../middleware/auth');
const { validateSubscription } = require('../middleware/validation');

const router = express.Router();

// Get user's subscriptions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { includeInactive = false } = req.query;

    const Subscription = getSubscriptionModel();

    const subscriptions = await Subscription.findByUserId(userId, {
      includeInactive: includeInactive === 'true'
    });

    res.json({
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint,
        isActive: sub.isActive,
        lastUsed: sub.lastUsed,
        preferences: sub.preferences,
        createdAt: sub.createdAt
      }))
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Create or update subscription
router.post('/', authMiddleware, validateSubscription, async (req, res) => {
  try {
    const userId = req.userId;
    const { subscription } = req.body;
    const userAgent = req.headers['user-agent'];

    const Subscription = getSubscriptionModel();

    const savedSubscription = await Subscription.createOrUpdate(
      userId,
      subscription,
      userAgent
    );

    res.status(201).json({
      message: 'Subscription saved successfully',
      subscription: {
        id: savedSubscription.id,
        endpoint: savedSubscription.endpoint,
        isActive: savedSubscription.isActive,
        preferences: savedSubscription.preferences
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update subscription preferences
router.put('/:subscriptionId/preferences', authMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { preferences } = req.body;
    const userId = req.userId;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        error: 'Valid preferences object is required'
      });
    }

    const Subscription = getSubscriptionModel();

    const subscription = await Subscription.findOne({
      where: {
        id: subscriptionId,
        userId
      }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found'
      });
    }

    await subscription.updatePreferences(preferences);

    res.json({
      message: 'Preferences updated successfully',
      subscription: {
        id: subscription.id,
        preferences: subscription.preferences
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Deactivate subscription
router.delete('/:subscriptionId', authMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.userId;

    const Subscription = getSubscriptionModel();

    const subscription = await Subscription.findOne({
      where: {
        id: subscriptionId,
        userId
      }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found'
      });
    }

    await subscription.deactivate();

    res.json({
      message: 'Subscription deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate subscription error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Deactivate subscription by endpoint (for service worker)
router.post('/deactivate', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        error: 'Endpoint is required'
      });
    }

    const Subscription = getSubscriptionModel();

    const subscription = await Subscription.deactivateByEndpoint(endpoint);

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found'
      });
    }

    res.json({
      message: 'Subscription deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate by endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  
  if (!publicKey) {
    return res.status(503).json({
      error: 'VAPID public key not configured'
    });
  }

  res.json({
    publicKey
  });
});

// Test notification (for development)
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { title = 'Test Notification', body = 'This is a test notification' } = req.body;

    const { sendNotificationToUser } = require('../services/webPushService');

    const result = await sendNotificationToUser(userId, {
      title,
      body,
      type: 'system',
      priority: 'normal',
      data: { test: true }
    });

    res.json({
      message: 'Test notification sent',
      result
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
