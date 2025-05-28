const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Chat = sequelize.define('Chat', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '新对话'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  modelId: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'deepseek-r1'
  }
});

// 与用户建立关联
Chat.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Chat, { foreignKey: 'userId', as: 'chats' });

module.exports = Chat; 