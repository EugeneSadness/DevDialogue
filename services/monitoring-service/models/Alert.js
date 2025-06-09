const { DataTypes } = require('sequelize');

const initAlertModel = (sequelize) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    alertName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'alert_name'
    },
    serviceName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'service_name'
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['critical', 'warning', 'info']]
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isResolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_resolved'
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'alerts',
    timestamps: false,
    indexes: [
      {
        fields: ['service_name']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['severity']
      },
      {
        fields: ['is_resolved']
      }
    ]
  });

  return Alert;
};

module.exports = {
  initAlertModel
};
