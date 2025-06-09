const { DataTypes } = require('sequelize');

let Chat;

const initChatModel = (sequelize) => {
  Chat = sequelize.define('Chat', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name',
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description'
    },
    type: {
      type: DataTypes.ENUM('private', 'group', 'channel'),
      defaultValue: 'private',
      field: 'chat_type'
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      validate: {
        isInt: true,
        min: 1
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },


    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'avatar_url'
    }
  }, {
    tableName: 'chats',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['creatorId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  // Instance methods
  Chat.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
  };

  Chat.prototype.updateLastMessage = async function() {
    // This functionality would need a separate last_message_at column
    // For now, just update the updated_at timestamp
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
      order: [['updated_at', 'DESC']]
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

  Chat.createPrivateChat = async function(creatorId, participantId, name) {
    return await this.create({
      name: name || 'Private Chat',
      type: 'private',
      creatorId
    });
  };

  Chat.createGroupChat = async function(creatorId, name, description = null) {
    return await this.create({
      name,
      description,
      type: 'group',
      creatorId
    });
  };

  Chat.searchByTitle = async function(searchTerm, userId, options = {}) {
    const { limit = 10, offset = 0 } = options;

    return await this.findAll({
      where: {
        name: {
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
      order: [['updated_at', 'DESC']]
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
