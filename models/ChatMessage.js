const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Chat = require('./Chat');

const ChatMessage = sequelize.define('ChatMessage', {
  chatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Chat,
      key: 'id'
    }
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['user', 'assistant']]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  reasoning: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

// 与Chat建立关联
ChatMessage.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });
Chat.hasMany(ChatMessage, { foreignKey: 'chatId', as: 'messages', onDelete: 'CASCADE' });

module.exports = ChatMessage; 