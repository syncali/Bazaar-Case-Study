'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Store extends Model {
    static associate(models) {
      Store.hasMany(models.StockMovement, { foreignKey: 'storeId' });
    }
  }
  Store.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    location: {
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'Store',
  });
  return Store;
};