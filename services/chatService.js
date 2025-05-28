const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const { Op } = require('sequelize');

/**
 * 聊天业务逻辑层
 */

// 创建新对话
exports.createChat = async (userData) => {
  try {
    const chat = await Chat.create({
      title: '新对话',
      userId: userData.userId || null,
      modelId: userData.modelId || 'deepseek-r1'
    });
    
    return {
      success: true,
      data: chat,
      statusCode: 200
    };
  } catch (error) {
    console.error('创建对话错误:', error);
    throw new Error(error.message);
  }
};

// 获取用户的所有对话
exports.getUserChats = async (userId) => {
  try {
    const chats = await Chat.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ChatMessage,
          as: 'messages',
          limit: 1,
          order: [['order', 'ASC']]
        }
      ]
    });
    
    return {
      success: true,
      data: chats
    };
  } catch (error) {
    console.error('获取用户对话列表错误:', error);
    throw new Error(error.message);
  }
};

// 获取对话详情
exports.getChatById = async (chatId, userId = null) => {
  try {
    const whereClause = { id: chatId };
    if (userId) {
      whereClause.userId = userId;
    }
    
    const chat = await Chat.findOne({
      where: whereClause,
      include: [
        {
          model: ChatMessage,
          as: 'messages',
          order: [['order', 'ASC']]
        }
      ]
    });
    
    if (!chat) {
      return {
        success: false,
        message: '未找到对话',
        statusCode: 404
      };
    }
    
    return {
      success: true,
      data: chat
    };
  } catch (error) {
    console.error(`获取对话(ID: ${chatId})错误:`, error);
    throw new Error(error.message);
  }
};

// 更新对话标题
exports.updateChatTitle = async (chatId, title, userId = null) => {
  try {
    const whereClause = { id: chatId };
    if (userId) {
      whereClause.userId = userId;
    }
    
    const chat = await Chat.findOne({ where: whereClause });
    
    if (!chat) {
      return {
        success: false,
        message: '未找到对话',
        statusCode: 404
      };
    }
    
    await chat.update({ title });
    
    return {
      success: true,
      data: chat
    };
  } catch (error) {
    console.error(`更新对话标题(ID: ${chatId})错误:`, error);
    throw new Error(error.message);
  }
};

// 删除对话
exports.deleteChat = async (chatId, userId = null) => {
  try {
    const whereClause = { id: chatId };
    if (userId) {
      whereClause.userId = userId;
    }
    
    const chat = await Chat.findOne({ where: whereClause });
    
    if (!chat) {
      return {
        success: false,
        message: '未找到对话',
        statusCode: 404
      };
    }
    
    // 删除关联的消息
    await ChatMessage.destroy({ where: { chatId } });
    
    // 删除对话
    await chat.destroy();
    
    return {
      success: true,
      message: '对话删除成功'
    };
  } catch (error) {
    console.error(`删除对话(ID: ${chatId})错误:`, error);
    throw new Error(error.message);
  }
};

// 添加消息到对话
exports.addMessageToChat = async (chatId, messageData, userId = null) => {
  try {
    // 检查聊天是否存在
    const whereClause = { id: chatId };
    if (userId) {
      whereClause.userId = userId;
    }
    
    const chat = await Chat.findOne({ where: whereClause });
    
    if (!chat) {
      return {
        success: false,
        message: '未找到对话',
        statusCode: 404
      };
    }
    
    // 获取当前消息数量作为顺序
    const messageCount = await ChatMessage.count({ where: { chatId } });
    
    // 创建新消息
    const message = await ChatMessage.create({
      chatId,
      role: messageData.role,
      content: messageData.content,
      reasoning: messageData.reasoning || null,
      order: messageCount
    });
    
    // 如果是第一条用户消息，更新对话标题
    if (messageCount === 0 && messageData.role === 'user') {
      const title = messageData.content.length > 20 
        ? messageData.content.substring(0, 20) + '...' 
        : messageData.content;
      
      await chat.update({ title });
    }
    
    return {
      success: true,
      data: message
    };
  } catch (error) {
    console.error(`添加消息到对话(ID: ${chatId})错误:`, error);
    throw new Error(error.message);
  }
};

// 获取对话的所有消息
exports.getChatMessages = async (chatId, userId = null) => {
  try {
    // 检查聊天是否存在
    const whereClause = { id: chatId };
    if (userId) {
      whereClause.userId = userId;
    }
    
    const chat = await Chat.findOne({ where: whereClause });
    
    if (!chat) {
      return {
        success: false,
        message: '未找到对话',
        statusCode: 404
      };
    }
    
    // 获取所有消息
    const messages = await ChatMessage.findAll({
      where: { chatId },
      order: [['order', 'ASC']]
    });
    
    return {
      success: true,
      data: messages
    };
  } catch (error) {
    console.error(`获取对话消息(chatId: ${chatId})错误:`, error);
    throw new Error(error.message);
  }
}; 