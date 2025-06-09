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
    messageType: {
      type: DataTypes.ENUM('text', 'image', 'file', 'system'),
      defaultValue: 'text'
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    replyToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      {
        fields: ['chatId', 'createdAt']
      },
      {
        fields: ['senderId']
      },
      {
        fields: ['replyToId']
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
    const { limit = 50, offset = 0, order = [['createdAt', 'DESC']] } = options;
    
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
          attributes: ['id', 'title', 'type']
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
      order: [['createdAt', 'DESC']]
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
