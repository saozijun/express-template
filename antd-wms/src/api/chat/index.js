/**
 * 模型列表
 * @param {*} data 
 * @returns 
 */
export const chatModels = (data) => {
  return useGet('/chat/models', data)
}

/**
 * 对话
 * @param {*} data 
 * @returns 
 */
export const chatApi = (data) => {
  return usePost('/chat', data)
}

/**
 * 创建新对话
 * @param {*} data 
 * @returns 
 */
export const createChatConversation = (data) => {
  return usePost('/chat/conversation', data)
}

/**
 * 获取用户对话列表
 * @param {*} data 
 * @returns 
 */
export const getUserConversations = (data) => {
  return useGet('/chat/conversations', data)
}

/**
 * 获取对话详情
 * @param {*} id 
 * @returns 
 */
export const getChatConversation = (id) => {
  return useGet(`/chat/conversation/${id}`)
}

/**
 * 更新对话标题
 * @param {*} id 
 * @param {*} data 
 * @returns 
 */
export const updateChatTitle = (id, data) => {
  return usePut(`/chat/conversation/${id}`, data)
}

/**
 * 删除对话
 * @param {*} id 
 * @returns 
 */
export const deleteConversation = (id) => {
  return useDelete(`/chat/conversation/${id}`)
}

/**
 * 获取对话消息
 * @param {*} id 
 * @returns 
 */
export const getChatMessages = (id) => {
  return useGet(`/chat/conversation/${id}/messages`)
}

/**
 * 添加消息到对话
 * @param {*} id 
 * @param {*} data 
 * @returns 
 */
export const addChatMessage = (id, data) => {
  return usePost(`/chat/conversation/${id}/message`, data)
}