"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {}
  }
  AuditLog.init(
    {
      userId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      actionType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      entityId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "AuditLog",
      updatedAt: false,
    }
  );
  return AuditLog;
};
