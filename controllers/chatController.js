const chatService = require('../services/chatService');
const { success, error } = require('../utils/response');

/**
 * 聊天控制器
 */

// @desc    创建新对话
// @route   POST /chat/conversation
// @access  Public/Private
exports.createChat = async (req, res) => {
  try {
    const userData = {
      userId: req.user ? req.user.id : null,
      modelId: req.body.modelId || 'deepseek-r1'
    };
    
    const result = await chatService.createChat(userData);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode);
    }
    
    return success(res, result.data, '对话创建成功');
  } catch (err) {
    console.error('创建对话失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取用户的所有对话
// @route   GET /chat/conversations
// @access  Private
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await chatService.getUserChats(userId);
    
    if (!result.success) {
      return error(res, result.message, 500);
    }
    
    return success(res, result.data, '获取对话列表成功');
  } catch (err) {
    console.error('获取对话列表失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取对话详情
// @route   GET /chat/conversation/:id
// @access  Public/Private
exports.getChatById = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user ? req.user.id : null;
    
    const result = await chatService.getChatById(chatId, userId);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode || 404);
    }
    
    return success(res, result.data, '获取对话成功');
  } catch (err) {
    console.error('获取对话失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    更新对话标题
// @route   PUT /chat/conversation/:id
// @access  Public/Private
exports.updateChatTitle = async (req, res) => {
  try {
    const chatId = req.params.id;
    const { title } = req.body;
    const userId = req.user ? req.user.id : null;
    
    if (!title) {
      return error(res, '标题不能为空', 400);
    }
    
    const result = await chatService.updateChatTitle(chatId, title, userId);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode || 404);
    }
    
    return success(res, result.data, '对话标题更新成功');
  } catch (err) {
    console.error('更新对话标题失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    删除对话
// @route   DELETE /chat/conversation/:id
// @access  Public/Private
exports.deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user ? req.user.id : null;
    
    const result = await chatService.deleteChat(chatId, userId);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode || 404);
    }
    
    return success(res, null, '对话删除成功');
  } catch (err) {
    console.error('删除对话失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取对话的所有消息
// @route   GET /chat/conversation/:id/messages
// @access  Public/Private
exports.getChatMessages = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user ? req.user.id : null;
    
    const result = await chatService.getChatMessages(chatId, userId);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode || 404);
    }
    
    return success(res, result.data, '获取对话消息成功');
  } catch (err) {
    console.error('获取对话消息失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    添加消息到对话
// @route   POST /chat/conversation/:id/message
// @access  Public/Private
exports.addMessageToChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const { role, content, reasoning } = req.body;
    const userId = req.user ? req.user.id : null;
    
    if (!role || !content) {
      return error(res, '角色和内容不能为空', 400);
    }
    
    const result = await chatService.addMessageToChat(chatId, {
      role,
      content,
      reasoning
    }, userId);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode || 404);
    }
    
    return success(res, result.data, '消息添加成功');
  } catch (err) {
    console.error('添加消息失败:', err);
    return error(res, '服务器错误', 500);
  }
}; 