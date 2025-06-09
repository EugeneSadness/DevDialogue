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
      console.warn('⚠️ VAPID keys not configured. Web Push notifications disabled.');
      return;
    }

    // Temporarily disable VAPID validation for development
    console.warn('⚠️ Web Push service disabled for development. Notifications will be stored in database only.');
    return;

    // webpush.setVapidDetails(
    //   vapidSubject,
    //   vapidPublicKey,
    //   vapidPrivateKey
    // );

    // isInitialized = true;
    // console.log('✅ Web Push service initialized with VAPID keys');
  } catch (error) {
    console.error('❌ Failed to initialize Web Push service:', error);
  }
};

const sendNotificationToUser = async (userId, notificationData) => {
  try {
    const Notification = getNotificationModel();

    // Create notification record (store in database)
    const notification = await Notification.createForUser(userId, notificationData);

    // Mark as sent immediately (since we're not using Web Push)
    await notification.markAsSent();

    console.log(`✅ Notification stored for user ${userId}: ${notificationData.title}`);

    return {
      success: true,
      notificationId: notification.id,
      message: 'Notification stored in database'
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
          data: notification.data
        });
      } catch (error) {
        console.error(`❌ Failed to process notification ${notification.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error processing pending notifications:', error);
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
