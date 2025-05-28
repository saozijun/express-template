const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { protect, optionalProtect } = require('../middleware/auth');
const {
  createChat,
  getUserChats,
  getChatById,
  updateChatTitle,
  deleteChat,
  getChatMessages,
  addMessageToChat
} = require('../controllers/chatController');

// 创建OpenAI实例
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

// 支持的模型列表
const SUPPORTED_MODELS = {
  'deepseek-r1': {
    name: 'Deepseek-R1',
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    hasReasoning: true
  },
  'qwen-plus-2025-04-28': {
    name: '通义千问',
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    hasReasoning: false
  }
};

// 多轮对话相关接口
router.post('/conversation', optionalProtect, createChat);
router.get('/conversations', protect, getUserChats);
router.get('/conversation/:id', optionalProtect, getChatById);
router.put('/conversation/:id', optionalProtect, updateChatTitle);
router.delete('/conversation/:id', optionalProtect, deleteChat);
router.get('/conversation/:id/messages', optionalProtect, getChatMessages);
router.post('/conversation/:id/message', optionalProtect, addMessageToChat);

// 流式聊天API - 支持GET和POST请求
router.get('/stream', handleStreamChat);
router.post('/stream', handleStreamChat);

// 处理流式聊天的函数
async function handleStreamChat(req, res) {
  try {
    // 从GET或POST请求中获取消息和模型
    const message = req.method === 'GET' ? req.query.message : req.body.message;
    const modelId = (req.method === 'GET' ? req.query.model : req.body.model);
    const chatId = (req.method === 'GET' ? req.query.chatId : req.body.chatId);
    const useHistory = (req.method === 'GET' ? req.query.useHistory === 'true' : req.body.useHistory === true);
    
    // 获取模型配置
    const modelConfig = SUPPORTED_MODELS[modelId];    
    if (!message) {
      console.log('错误: 消息为空');
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 设置响应头，支持流式输出
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 如果需要更改baseURL，创建新的实例
    const client = modelConfig.baseUrl !== openai.baseURL 
      ? new OpenAI({ 
          apiKey: process.env.DASHSCOPE_API_KEY, 
          baseURL: modelConfig.baseUrl 
        }) 
      : openai;

    // 准备消息数组
    let messages = [{ role: "user", content: message }];
    
    // 如果启用了历史记录且提供了对话ID，加载历史消息
    if (useHistory && chatId) {
      try {
        const chatService = require('../services/chatService');
        const result = await chatService.getChatMessages(chatId);
        
        if (result.success && result.data.length > 0) {
          // 使用历史消息构建上下文
          messages = result.data.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          
          // 添加当前用户消息
          messages.push({ role: "user", content: message });
        }
      } catch (error) {
        console.error('加载历史消息失败:', error);
        // 失败时仍使用单条消息继续
      }
    }
    
    // 创建流式聊天请求
    const stream = await client.chat.completions.create({
      model: modelId,
      messages: messages,
      stream: true,
    });
    
    let fullContent = '';
    let fullReasoning = '';
    
    // 处理流式响应
    for await (const chunk of stream) {
      // 发送数据块
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        fullContent += content;
        res.write(`data: ${JSON.stringify({
          content: content,
          type: 'content'
        })}\n\n`);
      }
      
      // 发送推理过程（如果模型支持且有）
      if (modelConfig.hasReasoning && chunk.choices[0]?.delta?.reasoning_content) {
        const reasoning = chunk.choices[0].delta.reasoning_content;
        fullReasoning += reasoning;
        res.write(`data: ${JSON.stringify({
          content: reasoning,
          type: 'reasoning'
        })}\n\n`);
      }
    }
    
    // 如果启用了历史记录且提供了对话ID，保存消息
    if (useHistory && chatId && fullContent) {
      try {
        const chatService = require('../services/chatService');
        // 保存用户消息
        await chatService.addMessageToChat(chatId, {
          role: 'user',
          content: message
        });
        
        // 保存AI响应
        await chatService.addMessageToChat(chatId, {
          role: 'assistant',
          content: fullContent,
          reasoning: fullReasoning || null
        });
      } catch (error) {
        console.error('保存消息失败:', error);
        // 错误不影响响应
      }
    }

    // 结束响应
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    // 如果流已经开始，发送错误信息作为事件
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

// 非流式聊天API
router.post('/', async (req, res) => {
  try {
    const { message, model = 'deepseek-r1', chatId, useHistory = false } = req.body;
    
    // 获取模型配置
    const modelConfig = SUPPORTED_MODELS[model] || SUPPORTED_MODELS['deepseek-r1'];
    
    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 如果需要更改baseURL，创建新的实例
    const client = modelConfig.baseUrl !== openai.baseURL 
      ? new OpenAI({ 
          apiKey: process.env.DASHSCOPE_API_KEY, 
          baseURL: modelConfig.baseUrl 
        }) 
      : openai;
    
    // 准备消息数组
    let messages = [{ role: "user", content: message }];
    
    // 如果启用了历史记录且提供了对话ID，加载历史消息
    if (useHistory && chatId) {
      try {
        const chatService = require('../services/chatService');
        const result = await chatService.getChatMessages(chatId);
        
        if (result.success && result.data.length > 0) {
          // 使用历史消息构建上下文
          messages = result.data.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          
          // 添加当前用户消息
          messages.push({ role: "user", content: message });
        }
      } catch (error) {
        console.error('加载历史消息失败:', error);
        // 失败时仍使用单条消息继续
      }
    }
    
    const completion = await client.chat.completions.create({
      model: model,
      messages: messages,
    });

    // 提取回复内容和推理过程（如果有）
    const content = completion.choices[0].message.content;
    const reasoning = modelConfig.hasReasoning ? completion.choices[0].message.reasoning_content : null;
    
    // 如果启用了历史记录且提供了对话ID，保存消息
    if (useHistory && chatId) {
      try {
        const chatService = require('../services/chatService');
        // 保存用户消息
        await chatService.addMessageToChat(chatId, {
          role: 'user',
          content: message
        });
        
        // 保存AI响应
        await chatService.addMessageToChat(chatId, {
          role: 'assistant',
          content: content,
          reasoning: reasoning || null
        });
      } catch (error) {
        console.error('保存消息失败:', error);
        // 错误不影响响应
      }
    }

    res.json({
      success: true,
      content,
      reasoning,
      code: 200
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取支持的模型列表
router.get('/models', (req, res) => {
  const models = Object.keys(SUPPORTED_MODELS).map(id => ({
    id,
    name: SUPPORTED_MODELS[id].name,
    hasReasoning: SUPPORTED_MODELS[id].hasReasoning
  }));
  
  res.json({ 
    success: true,
    data: models,
    code: 200
   });
});

module.exports = router; 