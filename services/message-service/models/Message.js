const { DataTypes } = require('sequelize');

let Message;

const initMessageModel = (sequelize) => {
  Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 3000] // Максимум 3000 символов
      }
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sender_id',
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
    messageType: {
      type: DataTypes.ENUM('text', 'image', 'file', 'system'),
      defaultValue: 'text',
      field: 'message_type'
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_edited'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted'
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'edited_at'
    },
    replyToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reply_to',
      references: {
        model: 'messages',
        key: 'id'
      }
    },

  }, {
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['chat_id', 'created_at']
      },
      {
        fields: ['sender_id']
      },
      {
        fields: ['reply_to']
      }
    ]
  });

  // Instance methods
  Message.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
  };

  // Class methods
  Message.findByChatId = async function(chatId, options = {}) {
    const { limit = 50, offset = 0, order = [['created_at', 'DESC']] } = options;

    return await this.findAll({
      where: { chatId },
      limit,
      offset,
      order,
      include: options.include || []
    });
  };

  Message.findByIdWithChat = async function(messageId) {
    return await this.findOne({
      where: { id: messageId },
      include: [
        {
          association: 'chat',
          attributes: ['id', 'name', 'type']
        }
      ]
    });
  };

  Message.searchInChat = async function(chatId, searchTerm, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    return await this.findAll({
      where: {
        chatId,
        content: {
          [sequelize.Op.iLike]: `%${searchTerm}%`
        }
      },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });
  };

  return Message;
};

const getMessageModel = () => {
  if (!Message) {
    throw new Error('Message model not initialized. Call initMessageModel() first.');
  }
  return Message;
};

module.exports = {
  initMessageModel,
  getMessageModel
};
