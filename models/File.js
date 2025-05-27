const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const File = sequelize.define('File', {
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileType: {
    type: DataTypes.ENUM('image', 'document', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// 建立与用户的关联
File.belongsTo(User, {
  foreignKey: 'userId',
  as: 'uploader'
});

User.hasMany(File, {
  foreignKey: 'userId',
  as: 'files'
});

module.exports = File; 