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
      validate: {
        isInt: true,
        min: 1
      }
    },
    chatId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1
      }
    },
    role: {
      type: DataTypes.ENUM('member', 'admin', 'owner'),
      defaultValue: 'member'
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastReadMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    isMuted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        canSendMessages: true,
        canEditMessages: false,
        canDeleteMessages: false,
        canInviteUsers: false,
        canKickUsers: false
      }
    }
  }, {
    tableName: 'chat_members',
    timestamps: true,
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
    this.lastReadMessageId = messageId;
    this.unreadCount = 0;
    return await this.save();
  };

  ChatMember.prototype.incrementUnreadCount = async function() {
    this.unreadCount += 1;
    return await this.save();
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
    const result = await this.findAll({
      where: { 
        userId,
        isActive: true 
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('unreadCount')), 'totalUnread']
      ]
    });
    
    return result[0]?.dataValues?.totalUnread || 0;
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
