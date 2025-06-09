const { DataTypes } = require('sequelize');

let Notification;

const initNotificationModel = (sequelize) => {
  Notification = sequelize.define('Notification', {
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 1000]
      }
    },
    type: {
      type: DataTypes.ENUM('message', 'chat_invite', 'system', 'reminder'),
      defaultValue: 'message'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'read'),
      defaultValue: 'pending'
    },
    subscriptionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id'
      }
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['scheduledAt']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Instance methods
  Notification.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
  };

  Notification.prototype.markAsSent = async function() {
    this.status = 'sent';
    this.sentAt = new Date();
    return await this.save();
  };

  Notification.prototype.markAsDelivered = async function() {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    return await this.save();
  };

  Notification.prototype.markAsRead = async function() {
    this.status = 'read';
    this.readAt = new Date();
    return await this.save();
  };

  Notification.prototype.markAsFailed = async function(errorMessage) {
    this.status = 'failed';
    this.errorMessage = errorMessage;
    this.retryCount += 1;
    return await this.save();
  };

  // Class methods
  Notification.findByUserId = async function(userId, options = {}) {
    const { limit = 20, offset = 0, status, type } = options;
    
    const whereClause = { userId };
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    
    return await this.findAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  };

  Notification.findPending = async function(options = {}) {
    const { limit = 100 } = options;
    
    return await this.findAll({
      where: {
        status: 'pending',
        [sequelize.Op.or]: [
          { scheduledAt: null },
          { scheduledAt: { [sequelize.Op.lte]: new Date() } }
        ]
      },
      limit,
      order: [['priority', 'DESC'], ['createdAt', 'ASC']]
    });
  };

  Notification.findExpired = async function() {
    return await this.findAll({
      where: {
        expiresAt: {
          [sequelize.Op.lt]: new Date()
        },
        status: {
          [sequelize.Op.in]: ['pending', 'sent']
        }
      }
    });
  };

  Notification.createForUser = async function(userId, notificationData) {
    const { title, body, type = 'message', priority = 'normal', data = {}, scheduledAt = null } = notificationData;
    
    return await this.create({
      userId,
      title,
      body,
      type,
      priority,
      data,
      scheduledAt,
      expiresAt: scheduledAt ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null // 7 days from now
    });
  };

  Notification.getUnreadCount = async function(userId) {
    return await this.count({
      where: {
        userId,
        status: {
          [sequelize.Op.in]: ['sent', 'delivered']
        }
      }
    });
  };

  Notification.markAllAsRead = async function(userId) {
    return await this.update(
      { 
        status: 'read',
        readAt: new Date()
      },
      {
        where: {
          userId,
          status: {
            [sequelize.Op.in]: ['sent', 'delivered']
          }
        }
      }
    );
  };

  Notification.cleanupOld = async function(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return await this.destroy({
      where: {
        createdAt: {
          [sequelize.Op.lt]: cutoffDate
        },
        status: {
          [sequelize.Op.in]: ['read', 'failed']
        }
      }
    });
  };

  return Notification;
};

const getNotificationModel = () => {
  if (!Notification) {
    throw new Error('Notification model not initialized. Call initNotificationModel() first.');
  }
  return Notification;
};

module.exports = {
  initNotificationModel,
  getNotificationModel
};
