const { DataTypes } = require('sequelize');

let Subscription;

const initSubscriptionModel = (sequelize) => {
  Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1
      }
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        isUrl: true
      }
    },
    p256dh: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    auth: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastUsed: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        messages: true,
        chatInvites: true,
        system: true,
        reminders: true
      }
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['endpoint'],
        unique: true
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['lastUsed']
      }
    ]
  });

  // Instance methods
  Subscription.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
  };

  Subscription.prototype.updateLastUsed = async function() {
    this.lastUsed = new Date();
    return await this.save();
  };

  Subscription.prototype.deactivate = async function() {
    this.isActive = false;
    return await this.save();
  };

  Subscription.prototype.updatePreferences = async function(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
    return await this.save();
  };

  Subscription.prototype.getWebPushSubscription = function() {
    return {
      endpoint: this.endpoint,
      keys: {
        p256dh: this.p256dh,
        auth: this.auth
      }
    };
  };

  // Class methods
  Subscription.findByUserId = async function(userId, options = {}) {
    const { includeInactive = false } = options;
    
    const whereClause = { userId };
    if (!includeInactive) {
      whereClause.isActive = true;
    }
    
    return await this.findAll({
      where: whereClause,
      order: [['lastUsed', 'DESC']]
    });
  };

  Subscription.findByEndpoint = async function(endpoint) {
    return await this.findOne({
      where: { endpoint }
    });
  };

  Subscription.findActiveByUserId = async function(userId) {
    return await this.findAll({
      where: { 
        userId,
        isActive: true 
      },
      order: [['lastUsed', 'DESC']]
    });
  };

  Subscription.createOrUpdate = async function(userId, subscriptionData, userAgent = null) {
    const { endpoint, keys } = subscriptionData;
    const { p256dh, auth } = keys;

    // Check if subscription already exists
    const existingSubscription = await this.findByEndpoint(endpoint);
    
    if (existingSubscription) {
      // Update existing subscription
      await existingSubscription.update({
        userId,
        p256dh,
        auth,
        userAgent,
        isActive: true,
        lastUsed: new Date()
      });
      return existingSubscription;
    } else {
      // Create new subscription
      return await this.create({
        userId,
        endpoint,
        p256dh,
        auth,
        userAgent,
        isActive: true,
        lastUsed: new Date()
      });
    }
  };

  Subscription.deactivateByEndpoint = async function(endpoint) {
    const subscription = await this.findByEndpoint(endpoint);
    if (subscription) {
      return await subscription.deactivate();
    }
    return null;
  };

  Subscription.cleanupInactive = async function(daysInactive = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    
    return await this.destroy({
      where: {
        [sequelize.Op.or]: [
          { isActive: false },
          { lastUsed: { [sequelize.Op.lt]: cutoffDate } }
        ]
      }
    });
  };

  Subscription.getUsersWithNotificationPreference = async function(notificationType) {
    return await this.findAll({
      where: {
        isActive: true,
        [`preferences.${notificationType}`]: true
      },
      attributes: ['userId'],
      group: ['userId']
    });
  };

  return Subscription;
};

const getSubscriptionModel = () => {
  if (!Subscription) {
    throw new Error('Subscription model not initialized. Call initSubscriptionModel() first.');
  }
  return Subscription;
};

module.exports = {
  initSubscriptionModel,
  getSubscriptionModel
};
