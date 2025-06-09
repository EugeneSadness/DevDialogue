const express = require('express');
const { getNotificationModel } = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const { validateNotification } = require('../middleware/validation');
const { sendNotificationToUser, sendBulkNotifications } = require('../services/webPushService');

const router = express.Router();

// Test route without auth
router.get('/test', (req, res) => {
  console.log('📥 GET /api/notifications/test - Test route accessed');
  res.json({ message: 'Notification service is working!', timestamp: new Date().toISOString() });
});

// Get user's notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('📥 GET /api/notifications/ - userId:', req.userId);
    const { limit = 20, offset = 0, status, type } = req.query;
    const userId = req.userId;

    const Notification = getNotificationModel();
    console.log('✅ Notification model retrieved successfully');

    const notifications = await Notification.findByUserId(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      isRead: status === 'read' ? true : status === 'unread' ? false : undefined,
      type
    });

    res.json({
      notifications,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get unread notification count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const Notification = getNotificationModel();

    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Send notification to user (internal API)
router.post('/send', validateNotification, async (req, res) => {
  try {
    const { userId, title, body, type, data } = req.body;

    const result = await sendNotificationToUser(userId, {
      title,
      body,
      type,
      data
    });

    res.status(201).json({
      message: 'Notification sent successfully',
      result
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Send bulk notifications (internal API)
router.post('/send-bulk', validateNotification, async (req, res) => {
  try {
    const { userIds, title, body, type, data } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'userIds must be a non-empty array'
      });
    }

    const results = await sendBulkNotifications(userIds, {
      title,
      body,
      type,
      data
    });

    const successCount = results.filter(r => r.success).length;

    res.status(201).json({
      message: 'Bulk notifications processed',
      results,
      summary: {
        total: userIds.length,
        successful: successCount,
        failed: userIds.length - successCount
      }
    });
  } catch (error) {
    console.error('Send bulk notifications error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const Notification = getNotificationModel();

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const Notification = getNotificationModel();

    const updatedCount = await Notification.markAllAsRead(userId);

    res.json({
      message: 'All notifications marked as read',
      updatedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get specific notification
router.get('/:notificationId', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const Notification = getNotificationModel();

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    res.json({
      notification
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Delete notification
router.delete('/:notificationId', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const Notification = getNotificationModel();

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    await notification.destroy();

    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
