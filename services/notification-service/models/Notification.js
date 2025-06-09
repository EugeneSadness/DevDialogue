const { DataTypes, Op } = require('sequelize');

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
      field: 'user_id',
      validate: {
        isInt: true,
        min: 1
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'title',
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'body',
      validate: {
        notEmpty: true,
        len: [1, 1000]
      }
    },
    type: {
      type: DataTypes.STRING(50),
      defaultValue: 'message',
      field: 'type'
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'data',
      defaultValue: {}
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    },
    isSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_sent'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // нет updated_at в реальной БД
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['is_read']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Instance methods
  Notification.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
  };

  Notification.prototype.markAsSent = async function() {
    this.isSent = true;
    this.sentAt = new Date();
    return await this.save();
  };

  Notification.prototype.markAsRead = async function() {
    this.isRead = true;
    return await this.save();
  };

  // Class methods
  Notification.findByUserId = async function(userId, options = {}) {
    const { limit = 20, offset = 0, isRead, type } = options;

    const whereClause = { userId };
    if (isRead !== undefined) whereClause.isRead = isRead;
    if (type) whereClause.type = type;

    return await this.findAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });
  };

  Notification.findPending = async function(options = {}) {
    const { limit = 100 } = options;

    return await this.findAll({
      where: {
        isSent: false
      },
      limit,
      order: [['created_at', 'ASC']]
    });
  };

  Notification.createForUser = async function(userId, notificationData) {
    const { title, body, type = 'message', data = {} } = notificationData;

    return await this.create({
      userId,
      title,
      body,
      type,
      data
    });
  };

  Notification.getUnreadCount = async function(userId) {
    return await this.count({
      where: {
        userId,
        isRead: false
      }
    });
  };

  Notification.markAllAsRead = async function(userId) {
    return await this.update(
      {
        isRead: true
      },
      {
        where: {
          userId,
          isRead: false
        }
      }
    );
  };

  Notification.cleanupOld = async function(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await this.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate
        },
        isRead: true
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
