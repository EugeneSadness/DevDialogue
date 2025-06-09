const { DataTypes } = require('sequelize');

const initHealthCheckModel = (sequelize) => {
  const HealthCheck = sequelize.define('HealthCheck', {
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
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['healthy', 'unhealthy', 'degraded']]
      }
    },
    responseTimeMs: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'response_time_ms'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message'
    },
    checkedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'checked_at'
    }
  }, {
    tableName: 'health_checks',
    timestamps: false,
    indexes: [
      {
        fields: ['service_name']
      },
      {
        fields: ['checked_at']
      },
      {
        fields: ['service_name', 'status']
      }
    ]
  });

  return HealthCheck;
};

module.exports = {
  initHealthCheckModel
};
