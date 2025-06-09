const webpush = require('web-push');
const { getSubscriptionModel } = require('../models/Subscription');
const { getNotificationModel } = require('../models/Notification');

let isInitialized = false;

const initWebPush = () => {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@messenger.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('⚠️ VAPID keys not configured. Web Push notifications will not work.');
      return;
    }

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    isInitialized = true;
    console.log('✅ Web Push service initialized with VAPID keys');
  } catch (error) {
    console.error('❌ Failed to initialize Web Push service:', error);
  }
};

const sendNotificationToUser = async (userId, notificationData) => {
  if (!isInitialized) {
    throw new Error('Web Push service not initialized');
  }

  try {
    const Subscription = getSubscriptionModel();
    const Notification = getNotificationModel();

    // Get user's active subscriptions
    const subscriptions = await Subscription.findActiveByUserId(userId);
    
    if (subscriptions.length === 0) {
      console.log(`No active subscriptions found for user ${userId}`);
      return { success: false, reason: 'No active subscriptions' };
    }

    // Create notification record
    const notification = await Notification.createForUser(userId, notificationData);

    const results = [];
    
    for (const subscription of subscriptions) {
      try {
        // Check if user wants this type of notification
        const notificationType = notificationData.type || 'message';
        if (!subscription.preferences[notificationType]) {
          console.log(`User ${userId} has disabled ${notificationType} notifications`);
          continue;
        }

        const pushSubscription = subscription.getWebPushSubscription();
        
        const payload = JSON.stringify({
          title: notificationData.title,
          body: notificationData.body,
          icon: notificationData.icon || '/icon-192x192.png',
          badge: notificationData.badge || '/badge-72x72.png',
          tag: notificationData.tag || `notification-${notification.id}`,
          data: {
            notificationId: notification.id,
            ...notificationData.data
          },
          actions: notificationData.actions || [],
          requireInteraction: notificationData.priority === 'urgent',
          silent: notificationData.priority === 'low'
        });

        const options = {
          TTL: 24 * 60 * 60, // 24 hours
          urgency: getPushUrgency(notificationData.priority),
          headers: {}
        };

        const result = await webpush.sendNotification(pushSubscription, payload, options);
        
        // Update subscription last used
        await subscription.updateLastUsed();
        
        results.push({
          subscriptionId: subscription.id,
          success: true,
          statusCode: result.statusCode
        });

        console.log(`✅ Notification sent to user ${userId}, subscription ${subscription.id}`);

      } catch (error) {
        console.error(`❌ Failed to send notification to subscription ${subscription.id}:`, error);
        
        // Handle specific errors
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription is no longer valid
          await subscription.deactivate();
          console.log(`🗑️ Deactivated invalid subscription ${subscription.id}`);
        }

        results.push({
          subscriptionId: subscription.id,
          success: false,
          error: error.message,
          statusCode: error.statusCode
        });
      }
    }

    // Update notification status
    const successfulSends = results.filter(r => r.success).length;
    if (successfulSends > 0) {
      await notification.markAsSent();
    } else {
      await notification.markAsFailed('Failed to send to any subscription');
    }

    return {
      success: successfulSends > 0,
      notificationId: notification.id,
      results,
      totalSubscriptions: subscriptions.length,
      successfulSends
    };

  } catch (error) {
    console.error('❌ Error in sendNotificationToUser:', error);
    throw error;
  }
};

const sendBulkNotifications = async (userIds, notificationData) => {
  const results = [];
  
  for (const userId of userIds) {
    try {
      const result = await sendNotificationToUser(userId, notificationData);
      results.push({
        userId,
        ...result
      });
    } catch (error) {
      results.push({
        userId,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

const processPendingNotifications = async () => {
  if (!isInitialized) {
    console.log('Web Push service not initialized, skipping pending notifications');
    return;
  }

  try {
    const Notification = getNotificationModel();
    const pendingNotifications = await Notification.findPending({ limit: 50 });
    
    console.log(`📬 Processing ${pendingNotifications.length} pending notifications`);
    
    for (const notification of pendingNotifications) {
      try {
        await sendNotificationToUser(notification.userId, {
          title: notification.title,
          body: notification.body,
          type: notification.type,
          priority: notification.priority,
          data: notification.data
        });
      } catch (error) {
        console.error(`❌ Failed to process notification ${notification.id}:`, error);
        await notification.markAsFailed(error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error processing pending notifications:', error);
  }
};

const getPushUrgency = (priority) => {
  switch (priority) {
    case 'urgent':
      return 'high';
    case 'high':
      return 'high';
    case 'normal':
      return 'normal';
    case 'low':
      return 'low';
    default:
      return 'normal';
  }
};

const generateVAPIDKeys = () => {
  return webpush.generateVAPIDKeys();
};

module.exports = {
  initWebPush,
  sendNotificationToUser,
  sendBulkNotifications,
  processPendingNotifications,
  generateVAPIDKeys
};
