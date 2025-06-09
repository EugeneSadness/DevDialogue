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
      field: 'user_id',
      validate: {
        isInt: true,
        min: 1
      }
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'endpoint',
      validate: {
        notEmpty: true,
        isUrl: true
      }
    },
    p256dhKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'p256dh_key',
      validate: {
        notEmpty: true
      }
    },
    authKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'auth_key',
      validate: {
        notEmpty: true
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'push_subscriptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['user_id', 'endpoint'],
        unique: true
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Instance methods
  Subscription.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
  };

  Subscription.prototype.deactivate = async function() {
    this.isActive = false;
    return await this.save();
  };

  Subscription.prototype.getWebPushSubscription = function() {
    return {
      endpoint: this.endpoint,
      keys: {
        p256dh: this.p256dhKey,
        auth: this.authKey
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
      order: [['created_at', 'DESC']]
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
      order: [['created_at', 'DESC']]
    });
  };

  Subscription.createOrUpdate = async function(userId, subscriptionData) {
    const { endpoint, keys } = subscriptionData;
    const { p256dh, auth } = keys;

    // Check if subscription already exists
    const existingSubscription = await this.findByEndpoint(endpoint);

    if (existingSubscription) {
      // Update existing subscription
      await existingSubscription.update({
        userId,
        p256dhKey: p256dh,
        authKey: auth,
        isActive: true
      });
      return existingSubscription;
    } else {
      // Create new subscription
      return await this.create({
        userId,
        endpoint,
        p256dhKey: p256dh,
        authKey: auth,
        isActive: true
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
        isActive: false
      }
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
