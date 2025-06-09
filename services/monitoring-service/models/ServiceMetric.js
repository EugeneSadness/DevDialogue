const { DataTypes } = require('sequelize');

const initServiceMetricModel = (sequelize) => {
  const ServiceMetric = sequelize.define('ServiceMetric', {
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
    metricName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'metric_name'
    },
    metricValue: {
      type: DataTypes.DECIMAL(15, 6),
      allowNull: false,
      field: 'metric_value'
    },
    metricType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'metric_type',
      validate: {
        isIn: [['counter', 'gauge', 'histogram']]
      }
    },
    labels: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'service_metrics',
    timestamps: false,
    indexes: [
      {
        fields: ['service_name']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['service_name', 'metric_name']
      }
    ]
  });

  return ServiceMetric;
};

module.exports = {
  initServiceMetricModel
};
