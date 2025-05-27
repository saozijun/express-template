const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Role = sequelize.define('Role', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: '角色名称不能为空' }
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Role; 