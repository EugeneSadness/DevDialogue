const { DataTypes } = require('sequelize');

let Chat;

const initChatModel = (sequelize) => {
  Chat = sequelize.define('Chat', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('private', 'group', 'channel'),
      defaultValue: 'private'
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        allowInvites: true,
        muteNotifications: false,
        messageRetention: 0 // 0 = unlimited
      }
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'chats',
    timestamps: true,
    indexes: [
      {
        fields: ['creatorId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['lastMessageAt']
      }
    ]
  });

  // Instance methods
  Chat.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
  };

  Chat.prototype.updateLastMessage = async function() {
    this.lastMessageAt = new Date();
    return await this.save();
  };

  // Class methods
  Chat.findByUserId = async function(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    return await this.findAll({
      include: [
        {
          association: 'members',
          where: { userId },
          attributes: []
        }
      ],
      where: { isActive: true },
      limit,
      offset,
      order: [['lastMessageAt', 'DESC']]
    });
  };

  Chat.findActiveById = async function(chatId) {
    return await this.findOne({
      where: { 
        id: chatId,
        isActive: true 
      },
      include: [
        {
          association: 'members',
          attributes: ['userId', 'role', 'joinedAt']
        }
      ]
    });
  };

  Chat.createPrivateChat = async function(creatorId, participantId, title) {
    return await this.create({
      title: title || 'Private Chat',
      type: 'private',
      creatorId,
      lastMessageAt: new Date()
    });
  };

  Chat.createGroupChat = async function(creatorId, title, description = null) {
    return await this.create({
      title,
      description,
      type: 'group',
      creatorId,
      lastMessageAt: new Date()
    });
  };

  Chat.searchByTitle = async function(searchTerm, userId, options = {}) {
    const { limit = 10, offset = 0 } = options;
    
    return await this.findAll({
      where: {
        title: {
          [sequelize.Op.iLike]: `%${searchTerm}%`
        },
        isActive: true
      },
      include: [
        {
          association: 'members',
          where: { userId },
          attributes: []
        }
      ],
      limit,
      offset,
      order: [['lastMessageAt', 'DESC']]
    });
  };

  return Chat;
};

const getChatModel = () => {
  if (!Chat) {
    throw new Error('Chat model not initialized. Call initChatModel() first.');
  }
  return Chat;
};

module.exports = {
  initChatModel,
  getChatModel
};
