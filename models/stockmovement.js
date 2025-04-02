'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StockMovement extends Model {
    static associate(models) {
      StockMovement.belongsTo(models.Product, { foreignKey: 'productId' });
      StockMovement.belongsTo(models.Store, { foreignKey: 'storeId' });
    }
  }
  StockMovement.init({
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Stores',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('in', 'out', 'manual'),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    }
  }, {
    sequelize,
    modelName: 'StockMovement',
    timestamps: true // Automatically add createdAt and updatedAt
  });
  return StockMovement;
};