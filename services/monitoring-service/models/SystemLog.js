const { DataTypes } = require('sequelize');

const initSystemLogModel = (sequelize) => {
  const SystemLog = sequelize.define('SystemLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    serviceName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'service_name'
    },
    level: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['error', 'warn', 'info', 'debug']]
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'system_logs',
    timestamps: false,
    indexes: [
      {
        fields: ['service_name']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['level']
      },
      {
        fields: ['service_name', 'level']
      }
    ]
  });

  return SystemLog;
};

module.exports = {
  initSystemLogModel
};
