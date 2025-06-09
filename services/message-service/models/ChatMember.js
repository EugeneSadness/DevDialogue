const { DataTypes } = require('sequelize');

let ChatMember;

const initChatMemberModel = (sequelize) => {
  ChatMember = sequelize.define('ChatMember', {
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
    chatId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'chat_id',
      validate: {
        isInt: true,
        min: 1
      }
    },
    role: {
      type: DataTypes.ENUM('member', 'admin', 'owner'),
      defaultValue: 'member',
      field: 'role'
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at'
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'left_at'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },

  }, {
    tableName: 'chat_members',
    timestamps: false,
    indexes: [
      {
        fields: ['userId', 'chatId'],
        unique: true
      },
      {
        fields: ['chatId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  // Instance methods
  ChatMember.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
  };

  ChatMember.prototype.markAsRead = async function(messageId) {
    // This functionality would need to be implemented in a separate table
    // For now, just return this instance
    return this;
  };

  ChatMember.prototype.incrementUnreadCount = async function() {
    // This functionality would need to be implemented in a separate table
    // For now, just return this instance
    return this;
  };

  ChatMember.prototype.leave = async function() {
    this.isActive = false;
    this.leftAt = new Date();
    return await this.save();
  };

  // Class methods
  ChatMember.findByUserAndChat = async function(userId, chatId) {
    return await this.findOne({
      where: { 
        userId, 
        chatId,
        isActive: true 
      }
    });
  };

  ChatMember.findChatMembers = async function(chatId, options = {}) {
    const { includeInactive = false } = options;
    
    const whereClause = { chatId };
    if (!includeInactive) {
      whereClause.isActive = true;
    }
    
    return await this.findAll({
      where: whereClause,
      order: [['joinedAt', 'ASC']]
    });
  };

  ChatMember.findUserChats = async function(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    return await this.findAll({
      where: { 
        userId,
        isActive: true 
      },
      include: [
        {
          association: 'chat',
          where: { isActive: true }
        }
      ],
      limit,
      offset,
      order: [['updatedAt', 'DESC']]
    });
  };

  ChatMember.addMember = async function(userId, chatId, role = 'member', addedBy = null) {
    return await this.create({
      userId,
      chatId,
      role,
      joinedAt: new Date(),
      isActive: true
    });
  };

  ChatMember.updateRole = async function(userId, chatId, newRole) {
    const member = await this.findByUserAndChat(userId, chatId);
    if (member) {
      member.role = newRole;
      return await member.save();
    }
    return null;
  };

  ChatMember.getUserUnreadCount = async function(userId) {
    // This functionality would need to be implemented with a separate unread messages table
    // For now, return 0
    return 0;
  };

  return ChatMember;
};

const getChatMemberModel = () => {
  if (!ChatMember) {
    throw new Error('ChatMember model not initialized. Call initChatMemberModel() first.');
  }
  return ChatMember;
};

module.exports = {
  initChatMemberModel,
  getChatMemberModel
};
