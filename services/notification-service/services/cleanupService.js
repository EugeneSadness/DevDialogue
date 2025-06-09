const { getNotificationModel } = require('../models/Notification');
const { getSubscriptionModel } = require('../models/Subscription');

const cleanupOldNotifications = async () => {
  try {
    console.log('🧹 Starting notification cleanup...');
    
    const Notification = getNotificationModel();
    const Subscription = getSubscriptionModel();
    
    // Clean up old notifications (older than 30 days)
    const deletedNotifications = await Notification.cleanupOld(30);
    console.log(`🗑️ Deleted ${deletedNotifications} old notifications`);
    
    // Clean up inactive subscriptions (inactive for 90 days)
    const deletedSubscriptions = await Subscription.cleanupInactive(90);
    console.log(`🗑️ Deleted ${deletedSubscriptions} inactive subscriptions`);
    
    // Clean up expired notifications
    const expiredNotifications = await Notification.findExpired();
    for (const notification of expiredNotifications) {
      await notification.markAsFailed('Notification expired');
    }
    console.log(`⏰ Marked ${expiredNotifications.length} notifications as expired`);
    
    console.log('✅ Notification cleanup completed');
    
    return {
      deletedNotifications,
      deletedSubscriptions,
      expiredNotifications: expiredNotifications.length
    };
    
  } catch (error) {
    console.error('❌ Error during notification cleanup:', error);
    throw error;
  }
};

const getCleanupStats = async () => {
  try {
    const Notification = getNotificationModel();
    const Subscription = getSubscriptionModel();
    
    const stats = {
      totalNotifications: await Notification.count(),
      pendingNotifications: await Notification.count({ where: { status: 'pending' } }),
      sentNotifications: await Notification.count({ where: { status: 'sent' } }),
      failedNotifications: await Notification.count({ where: { status: 'failed' } }),
      readNotifications: await Notification.count({ where: { status: 'read' } }),
      totalSubscriptions: await Subscription.count(),
      activeSubscriptions: await Subscription.count({ where: { isActive: true } }),
      inactiveSubscriptions: await Subscription.count({ where: { isActive: false } })
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting cleanup stats:', error);
    throw error;
  }
};

module.exports = {
  cleanupOldNotifications,
  getCleanupStats
};
