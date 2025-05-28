<template>
  <div class="chat-container">
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <h3>对话历史</h3>
        <a-tooltip title="新建对话">
          <a-button type="primary" shape="circle" size="small" @click="confirmNewChat">
            <template #icon><plus-outlined /></template>
          </a-button>
        </a-tooltip>
      </div>
      <div class="sidebar-content">
        <div v-if="chatHistory.length === 0" class="empty-history">
          <a-empty description="暂无对话历史" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
        </div>
        <a-spin v-else-if="loading && !messages.length" />
        <div v-else v-for="(chat, idx) in chatHistory" :key="idx" 
             class="history-item" 
             :class="{ active: currentChatId === chat.id }"
             @click="selectChat(chat.id)">
          <div class="history-item-content">
            <div v-if="editingChatId === chat.id" class="edit-title" @click.stop>
              <a-input v-model:value="newChatTitle" size="small" @pressEnter="saveTitle" />
              <div class="edit-actions">
                <a-button type="text" size="small" @click="saveTitle">
                  <template #icon><check-outlined /></template>
                </a-button>
                <a-button type="text" size="small" @click="cancelEditTitle">
                  <template #icon><close-outlined /></template>
                </a-button>
              </div>
            </div>
            <template v-else>
              <div class="history-title">{{ chat.title || '新对话' }}</div>
              <div class="history-time">{{ formatTime(chat.time) }}</div>
            </template>
          </div>
          <div v-if="!editingChatId" class="history-actions">
            <a-button v-if="useMultiTurn" type="text" size="small" @click.stop="startEditTitle(chat.id, $event)">
              <template #icon><edit-outlined /></template>
            </a-button>
            <a-button type="text" size="small" @click.stop="deleteChat(chat.id, $event)">
              <template #icon><delete-outlined /></template>
            </a-button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-main">
      <div class="chat-header">
        <h2>AI 智能助手</h2>
        <div class="header-controls">
          <div class="stream-toggle">
            <span class="toggle-label">流式响应</span>
            <a-switch v-model:checked="useStreamMode" size="small" />
          </div>
          <div class="multi-turn-toggle">
            <span class="toggle-label">多轮对话</span>
            <a-switch v-model:checked="useMultiTurn" size="small" />
          </div>
          <div class="model-selector">
            <a-dropdown placement="bottomRight">
              <a-button size="small" type="text" class="model-btn">
                {{ getCurrentModelName() }}
                <down-outlined style="font-size: 10px; margin-left: 4px;" />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item v-for="model in modelList" :key="model.id" @click="changeModel(model.id)">
                    <div class="model-option">
                      <span class="model-name">{{ model.name }}</span>
                      <check-outlined v-if="selectedModel === model.id" />
                    </div>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
      </div>
      
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <message-outlined style="font-size: 64px; color: #e6e6e6;" />
          </div>
          <h3>开始一个新对话</h3>
          <p>您可以询问任何问题，AI助手将为您提供帮助</p>
          <div class="example-prompts">
            <div class="example-prompt" v-for="(prompt, idx) in examplePrompts" :key="idx" @click="useExamplePrompt(prompt)">
              {{ prompt }}
            </div>
          </div>
        </div>
        <template v-else>
          <div v-for="(msg, index) in messages" :key="index" :class="['message-row', msg.role]">
            <div class="avatar-container">
              <div class="avatar">
                <img v-if="msg.role === 'assistant'" src="../../assets/images/ai.gif" alt="AI 助手" />
                <img v-else :src="userAvatar" alt="用户" />
              </div>
            </div>
            <div class="bubble-container">
              <div class="bubble">
                <div v-if="msg.role === 'assistant' && msg.reasoning" class="reasoning">
                  <div class="reasoning-header" @click="toggleReasoning(index)">
                    <span>思考过程</span>
                    <down-outlined v-if="!msg.showReasoning" />
                    <up-outlined v-else />
                  </div>
                  <div v-if="msg.showReasoning" class="reasoning-content">{{ msg.reasoning }}</div>
                </div>
                <div class="message-content">
                  <!-- 用户消息保持原样显示 -->
                  <div v-if="msg.role === 'user'">{{ msg.content }}</div>
                  <!-- AI 消息使用 v-md-editor 渲染 -->
                  <v-md-preview v-else :text="msg.content" @copy-code-success="handleCopyCodeSuccess" />
                </div>
              </div>
              <div class="message-actions" v-if="msg.role === 'assistant'">
                <a-tooltip title="复制">
                  <copy-outlined @click="copyMessage(msg.content)" />
                </a-tooltip>
              </div>
            </div>
          </div>
          <div v-if="loading" class="message-row assistant">
            <div class="avatar-container">
              <div class="avatar">
                <img src="../../assets/images/ai.gif" alt="AI 助手" />
              </div>
            </div>
            <div class="bubble-container">
              <div class="bubble loading-bubble">
                <div v-if="currentReasoning" class="reasoning">
                  <div class="reasoning-header" @click="showCurrentReasoning = !showCurrentReasoning">
                    <span>思考过程</span>
                    <down-outlined v-if="!showCurrentReasoning" />
                    <up-outlined v-else />
                  </div>
                  <div v-if="showCurrentReasoning" class="reasoning-content">{{ currentReasoning }}</div>
                </div>
                <div class="message-content">
                  <!-- 使用 v-md-editor 渲染流式响应 -->
                  <v-md-preview v-if="currentResponse" :text="currentResponse" @copy-code-success="handleCopyCodeSuccess" />
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
      
      <div class="chat-input">
        <a-textarea
          v-model:value="userInput"
          :rows="2"
          placeholder="输入您的问题..."
          :disabled="loading"
          @keydown.enter.prevent="handleSend"
          class="input-textarea"
        />
        <div class="input-actions">
          <a-tooltip title="待开发">
            <a-button type="text" :disabled="loading" class="action-btn">
              <template #icon><paper-clip-outlined /></template>
            </a-button>
          </a-tooltip>
          <a-button 
            type="primary" 
            :disabled="!userInput.trim() || loading" 
            @click="handleSend"
            class="send-btn"
          >
            发送
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { message, Empty, Modal } from 'ant-design-vue';
import { 
  PlusOutlined, 
  MessageOutlined, 
  DownOutlined, 
  UpOutlined, 
  CopyOutlined,
  PaperClipOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  CloseOutlined
} from '@ant-design/icons-vue';
import { chatModels, chatApi, 
  createChatConversation, 
  getUserConversations, 
  getChatConversation, 
  updateChatTitle, 
  deleteConversation, 
  getChatMessages 
} from '@/api/chat';
// 直接导入预览组件
import VMdPreview from '@kangc/v-md-editor/lib/preview';
import '@kangc/v-md-editor/lib/style/preview.css';
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js';
import '@kangc/v-md-editor/lib/theme/style/github.css';

// 引入代码高亮
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// 引入代码复制功能插件
import createCopyCodePlugin from '@kangc/v-md-editor/lib/plugins/copy-code/index';
import '@kangc/v-md-editor/lib/plugins/copy-code/copy-code.css';
import { useUserStore } from "~@/stores/user";
const userStore = useUserStore();
// 配置 v-md-editor 预览组件
VMdPreview.use(githubTheme, {
  Hljs: hljs,
});

// 使用代码复制功能
VMdPreview.use(createCopyCodePlugin());

const baseURL = import.meta.env.VITE_APP_BASE_URL;

const userAvatar = computed(() => userStore.avatar);
const userInput = ref('');
const messages = ref([]);
const loading = ref(false);
const currentResponse = ref('');
const currentReasoning = ref('');
const showCurrentReasoning = ref(true);
const messagesContainer = ref(null);
const selectedModel = ref('deepseek-r1');
const modelList = ref([]);
const currentChatId = ref('');
const useStreamMode = ref(true);
const useMultiTurn = ref(false);
const chatHistory = ref([]);
const editingChatTitle = ref(false);
const editingChatId = ref(null);
const newChatTitle = ref('');

const defaultModels = [
  { id: 'qwen-max', name: '通义千问-Max', hasReasoning: false }
];

const examplePrompts = [
  "解释量子计算的基本原理",
  "如何提高英语口语水平？",
  "写一个简单的Python爬虫程序",
  "分析当前人工智能发展的趋势",
];

// 获取模型列表
const fetchModelList = async () => {
  try {
    const { data } = await chatModels();
    if (data && data.length > 0) {
      modelList.value = data;
    } else {
      modelList.value = defaultModels;
    }
  } catch (error) {
    modelList.value = defaultModels;
  }
};

// 发送消息
const handleSend = async () => {
  const input = userInput.value.trim();
  if (!input || loading.value) return;
  
  // 确保有对话ID
  if (useMultiTurn.value && !currentChatId.value) {
    await createNewChat();
  }
  
  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: input
  });
  
  // 更新当前对话标题
  if (useMultiTurn.value && messages.value.length === 1) {
    const currentChat = chatHistory.value.find(chat => chat.id === currentChatId.value);
    if (currentChat) {
      currentChat.title = input.length > 20 ? input.substring(0, 20) + '...' : input;
    }
  }
  
  // 清空输入框
  userInput.value = '';
  
  // 滚动到底部
  await nextTick();
  scrollToBottom();
  
  // 设置加载状态
  loading.value = true;
  currentResponse.value = '';
  currentReasoning.value = '';
  
  try {
    if (useStreamMode.value) {
      // 流式响应模式
      // 创建 EventSource 连接
      const params = useMultiTurn.value 
        ? `message=${encodeURIComponent(input)}&model=${selectedModel.value}&chatId=${currentChatId.value}&useHistory=true`
        : `message=${encodeURIComponent(input)}&model=${selectedModel.value}`;
      
      const eventSource = new EventSource(`${baseURL}/chat/stream?${params}`);
      
      // 监听消息事件
      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          // 流结束
          eventSource.close();
          loading.value = false;
          
          // 添加完整的回复到消息列表
          if (currentResponse.value) {
            messages.value.push({
              role: 'assistant',
              content: currentResponse.value,
              reasoning: currentReasoning.value || null,
              showReasoning: currentReasoning.value ? true : false
            });
          }
          
          // 重置当前响应
          currentResponse.value = '';
          currentReasoning.value = '';
          scrollToBottom();
          return;
        }
        
        try {
          const data = JSON.parse(event.data);
          
          // 处理内容或推理过程
          if (data.type === 'content') {
            currentResponse.value += data.content;
          } else if (data.type === 'reasoning') {
            currentReasoning.value += data.content;
          } else if (data.error) {
            loading.value = false;
            eventSource.close();
          }
          
          scrollToBottom();
        } catch (error) { }
      };
      
      // 监听错误
      eventSource.onerror = (error) => {
        loading.value = false;
        eventSource.close();
      };
    } else {
      // 非流式响应模式
      const requestData = {
        message: input,
        model: selectedModel.value
      };
      
      // 如果启用多轮对话，添加相关参数
      if (useMultiTurn.value) {
        requestData.chatId = currentChatId.value;
        requestData.useHistory = true;
      }
      
      const data = await chatApi(requestData);
      const { content } = data;
      // 处理返回的内容，如果是字符串形式的JSON，需要解析
      try {
        // 检查内容是否为字符串形式的JSON
        if (typeof content === 'string' && (content.startsWith('"') && content.endsWith('"'))) {
          content = JSON.parse(content);
        }
      } catch (error) {
        console.error('解析返回内容失败:', error);
      }
      
      messages.value.push({
        role: 'assistant',
        content: content,
        reasoning: data.reasoning || null,
        showReasoning: data.reasoning ? true : false
      });
      
      // 结束加载状态
      loading.value = false;
      scrollToBottom();
    }
  } catch (error) {
    loading.value = false;
  }
};

// 创建新对话
const createNewChat = async () => {
  try {
    loading.value = true;
    
    // 记录对话是否已保存到服务器
    let savedToServer = false;
    
    if (useMultiTurn.value) {
      // 调用API创建新对话
      const result = await createChatConversation({
        modelId: selectedModel.value
      });
      
      if (result.success && result.data) {
        // 使用服务器返回的对话ID
        currentChatId.value = result.data.id.toString();
        savedToServer = true;
        
        // 添加到对话历史
        chatHistory.value.unshift({
          id: currentChatId.value,
          title: '新对话',
          time: new Date(result.data.createdAt || Date.now()),
          savedToServer // 标记为已保存
        });
      } else {
        throw new Error('创建对话失败');
      }
    } else {
      // 本地生成ID
      currentChatId.value = Date.now().toString();
      
      // 添加到对话历史
      chatHistory.value.unshift({
        id: currentChatId.value,
        title: '新对话',
        time: new Date(),
        savedToServer: false // 标记为未保存
      });
    }
    
    // 清空消息
    messages.value = [];
    
    // 添加欢迎消息
    messages.value.push({
      role: 'assistant',
      content: '你好！我是AI助手，有什么可以帮助你的？',
      reasoning: null
    });
    
    // 滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  } catch (error) {
    // 出错时使用本地ID
    currentChatId.value = Date.now().toString();
    chatHistory.value.unshift({
      id: currentChatId.value,
      title: '新对话',
      time: new Date(),
      savedToServer: false // 标记为未保存
    });
    
    // 添加欢迎消息
    messages.value = [{
      role: 'assistant',
      content: '你好！我是AI助手，有什么可以帮助你的？',
      reasoning: null
    }];
  } finally {
    loading.value = false;
  }
};

// 开始新对话
const startNewChat = async () => {
  // 如果已经有一个新的空对话，直接使用它而不是创建新的
  const hasEmptyChat = chatHistory.value.some(chat => {
    // 检查是否是新对话（只有欢迎消息）
    return chat.id === currentChatId.value && messages.value.length <= 1;
  });
  
  // 如果没有空对话，才创建新的
  if (!hasEmptyChat) {
    await createNewChat();
  }
  
  // 如果有对话，选中第一个
  if (chatHistory.value.length > 0) {
    currentChatId.value = chatHistory.value[0].id;
  }
};

// 选择对话
const selectChat = async (id) => {
  if (id === currentChatId.value && messages.value.length > 0) return;
  
  currentChatId.value = id;
  messages.value = [];
  
  try {
    loading.value = true;
    const result = await getChatMessages(id);
    
    if (result.success && result.data) {
      // 处理消息数据
      messages.value = result.data.map(msg => ({
        role: msg.role,
        content: msg.content,
        reasoning: msg.reasoning,
        showReasoning: msg.reasoning ? true : false
      }));
      
      // 如果消息为空，添加欢迎消息
      if (messages.value.length === 0) {
        messages.value.push({
          role: 'assistant',
          content: '你好！我是AI助手，有什么可以帮助你的？',
          reasoning: null
        });
      }
    } else {
      // API请求成功但没有消息，添加欢迎消息
      messages.value.push({
        role: 'assistant',
        content: '你好！我是AI助手，有什么可以帮助你的？',
        reasoning: null
      });
    }
  } catch (error) {
    console.error('加载对话消息失败:', error);
    message.error('加载对话消息失败');
    
    // 出错时添加欢迎消息
    messages.value.push({
      role: 'assistant',
      content: '你好！我是AI助手，有什么可以帮助你的？',
      reasoning: null
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

// 删除对话
const deleteChat = async (id, event) => {
  // 阻止事件冒泡
  if (event) {
    event.stopPropagation();
  }
  
  // 使用 Modal.confirm 进行二次确认
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个对话吗？删除后将无法恢复。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        // 获取要删除的对话
        const chatToDelete = chatHistory.value.find(chat => chat.id === id);
        
        // 如果对话存在且已保存到服务器，调用API删除
        if (chatToDelete && chatToDelete.savedToServer !== false && useMultiTurn.value) {
          await deleteConversation(id);
        }
        
        // 从列表中移除
        const index = chatHistory.value.findIndex(chat => chat.id === id);
        if (index !== -1) {
          chatHistory.value.splice(index, 1);
        }
        
        // 如果删除的是当前对话，创建新对话或选择另一个对话
        if (id === currentChatId.value) {
          if (chatHistory.value.length > 0) {
            // 如果还有其他对话，选择第一个
            currentChatId.value = chatHistory.value[0].id;
            await selectChat(currentChatId.value);
          } else {
            // 如果没有其他对话，创建新对话
            await startNewChat();
          }
        }
        
        message.success('对话已删除');
      } catch (error) {
        console.error('删除对话失败:', error);
        message.error('删除对话失败');
      }
    }
  });
};

// 开始编辑对话标题
const startEditTitle = (id, event) => {
  // 阻止事件冒泡
  if (event) {
    event.stopPropagation();
  }
  
  const chat = chatHistory.value.find(c => c.id === id);
  if (chat) {
    editingChatId.value = id;
    newChatTitle.value = chat.title || '';
    
    // 使用nextTick确保DOM更新后聚焦输入框
    nextTick(() => {
      // 获取输入框元素并聚焦
      const inputEl = document.querySelector('.edit-title .ant-input');
      if (inputEl) {
        inputEl.focus();
      }
    });
  }
};

// 保存对话标题
const saveTitle = async () => {
  if (!editingChatId.value) {
    editingChatId.value = null;
    return;
  }
  
  // 验证标题是否为空
  if (!newChatTitle.value.trim()) {
    message.warning('标题不能为空');
    return;
  }
  
  try {
    if (useMultiTurn.value) {
      // 调用API更新标题
      await updateChatTitle(editingChatId.value, { title: newChatTitle.value });
    }
    
    // 更新本地状态
    const chat = chatHistory.value.find(c => c.id === editingChatId.value);
    if (chat) {
      chat.title = newChatTitle.value;
    }
    
    message.success('标题已更新');
  } catch (error) {
    console.error('更新对话标题失败:', error);
    message.error('更新标题失败');
  } finally {
    editingChatId.value = null;
  }
};

// 取消编辑标题
const cancelEditTitle = () => {
  editingChatId.value = null;
};

// 加载对话历史
const loadChatHistory = async (forceCreateNew = false) => {
  try {
    loading.value = true;
    
    // 如果强制创建新对话，则跳过历史加载
    if (forceCreateNew) {
      await createNewChat();
      return;
    }
    
    // 避免重复加载：如果已经有对话且不是强制刷新，则跳过
    if (chatHistory.value.length > 0 && !forceCreateNew) {
      return;
    }
    
    // 调用API获取对话历史
    const result = await getUserConversations();
    
    if (result.success && result.data && result.data.length > 0) {
      // 处理历史数据
      chatHistory.value = result.data.map(chat => ({
        id: chat.id.toString(),
        title: chat.title || '新对话',
        time: new Date(chat.createdAt || Date.now()),
        savedToServer: true // 标记为已保存
      }));
      
      // 选择第一个对话
      currentChatId.value = chatHistory.value[0].id;
      
      // 加载选中对话的消息
      await selectChat(currentChatId.value);
    } else {
      // 如果API没有返回数据或对话为空，创建新对话
      await createNewChat();
    }
  } catch (error) {
    console.error('加载对话历史失败:', error);
    message.error('加载对话历史失败');
    
    // 出错时创建新对话
    await createNewChat();
  } finally {
    loading.value = false;
  }
};

// 已经初始化标志
const initialized = ref(false);

// 监听多轮对话开关变化
watch(useMultiTurn, async (newValue) => {
  // 组件初始挂载时不处理
  if (!initialized.value) {
    return;
  }
  
  if (newValue) {
    // 启用多轮对话时，加载历史
    await loadChatHistory();
  } else {
    // 禁用多轮对话时，使用本地数据
    chatHistory.value = [
      { id: Date.now().toString(), title: '新对话', time: new Date(), savedToServer: false }
    ];
    currentChatId.value = chatHistory.value[0].id;
    
    // 重置消息
    messages.value = [{
      role: 'assistant',
      content: '你好！我是AI助手，有什么可以帮助你的？',
      reasoning: null
    }];
  }
});

// 组件挂载后添加欢迎消息和初始化
onMounted(async () => {
  // 获取模型列表
  await fetchModelList();
  
  // 默认使用流式响应
  useStreamMode.value = true;
  
  // 默认启用多轮对话
  useMultiTurn.value = true;
  
  // 初始化对话历史
  await loadChatHistory();
  
  // 标记为已初始化
  initialized.value = true;
});

// 切换显示/隐藏推理过程
const toggleReasoning = (index) => {
  messages.value[index].showReasoning = !messages.value[index].showReasoning;
};

// 格式化消息内容（处理 Markdown）
const formatMessage = (content) => {
  if (!content) return '';
  return content; // 直接返回内容，由 v-md-editor 组件处理渲染
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    nextTick(() => {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    });
  }
};

// 复制消息内容
const copyMessage = (content) => {
  navigator.clipboard.writeText(content).then(() => {
    message.success('已复制到剪贴板');
  }).catch(() => {
    message.error('复制失败');
  });
};

// 复制代码成功处理
const handleCopyCodeSuccess = (code) => {
  message.success('代码已复制到剪贴板');
};

// 格式化时间
const formatTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const msgDate = new Date(date);
  
  if (now.toDateString() === msgDate.toDateString()) {
    return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

// 获取当前模型名称
const getCurrentModelName = () => {
  const model = modelList.value.find(m => m.id === selectedModel.value);
  return model ? model.name : '加载中...';
};

// 更改模型
const changeModel = (modelId) => {
  selectedModel.value = modelId;
};

// 使用示例提示词
const useExamplePrompt = (prompt) => {
  userInput.value = prompt;
};

// 监听消息变化，自动滚动到底部
watch(messages, () => {
  scrollToBottom();
}, { deep: true });

// 确认新建对话
const confirmNewChat = () => {
  if (messages.value.length > 1) {
    Modal.confirm({
      title: '新建对话',
      content: '新建对话将会关闭当前对话，确定要继续吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: startNewChat
    });
  } else {
    startNewChat();
  }
};
</script>

<style lang="less" scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 164px);
  background-color: #f9f9f9;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  margin: 0 16px;
}

.chat-sidebar {
  width: 240px;
  background-color: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  
  .sidebar-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    
    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 500;
      color: #333;
    }
  }
  
  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: #e0e0e0;
      border-radius: 4px;
    }
    
    .empty-history {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #999;
      font-size: 14px;
    }
    
    .history-item {
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid transparent;
      
      &:hover {
        background-color: #f5f5f5;
        border-color: #e6e6e6;
        
        .history-actions {
          opacity: 1;
        }
      }
      
      &.active {
        background-color: rgba(24, 144, 255, 0.08);
        border-color: rgba(24, 144, 255, 0.2);
        
        .history-title {
          color: #1890ff;
          font-weight: 500;
        }
        
        .history-actions {
          opacity: 1;
        }
      }
      
      .history-item-content {
        flex: 1;
        overflow: hidden;
        
        .history-title {
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #333;
        }
        
        .history-time {
          font-size: 12px;
          color: #999;
          margin-top: 3px;
        }
        
        .edit-title {
          display: flex;
          align-items: center;
          width: 100%;
          
          .ant-input {
            flex: 1;
            height: 24px;
            font-size: 13px;
          }
          
          .edit-actions {
            display: flex;
            align-items: center;
            margin-left: 4px;
            
            .ant-btn {
              padding: 0 4px;
              height: 24px;
              
              .anticon {
                font-size: 12px;
              }
            }
          }
        }
      }
      
      .history-actions {
        display: flex;
        align-items: center;
        opacity: 0;
        transition: opacity 0.2s;
        
        .ant-btn {
          padding: 0 4px;
          height: 24px;
          
          .anticon {
            font-size: 12px;
            color: #666;
          }
          
          &:hover .anticon {
            color: #1890ff;
          }
        }
      }
    }
  }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fff;
}

.chat-header {
  padding: 14px 20px;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    margin: 0;
    font-size: 16px;
    color: #333;
    font-weight: 500;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f9f9f9;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #e0e0e0;
    border-radius: 4px;
  }
}

// 消息行样式
.message-row {
  display: flex;
  margin-bottom: 20px;
  position: relative;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  &.user {
    flex-direction: row-reverse;
    
    .bubble-container {
      align-items: flex-end;
    }
  }
  
  .avatar-container {
    margin: 0 12px;
    align-self: flex-start;
    
    .avatar {
      width: 50px;
      height: 50px;
      overflow: hidden;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 13px;
      flex-shrink: 0;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      img{
        width: 100%;
        height: 100%;
      }
    }
  }
  
  &.user .avatar {
    // background-color: #1890ff;
    color: white;
  }
  
  &.assistant .avatar {
    // background-color: #52c41a;
    color: white;
  }
  
  .bubble-container {
    display: flex;
    align-items: flex-start;
    max-width: 70%;
    position: relative;
    
    .bubble {
      padding: 12px 16px;
      border-radius: 18px;
      position: relative;
      margin-top: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      min-width: 60px;
      word-break: break-word;
      
      &::before {
        content: '';
        position: absolute;
        top: 14px;
        width: 0;
        height: 0;
        border: 8px solid transparent;
      }
    }
    
    .message-actions {
      opacity: 0;
      transition: opacity 0.2s;
      margin: 8px;
      position: absolute;
      right: -48px;
      top: 0;
      background-color: white;
      border-radius: 4px;
      padding: 3px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      .anticon {
        color: #666;
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
        
        &:hover {
          color: #1890ff;
        }
      }
    }
    
    &:hover .message-actions {
      opacity: 1;
    }
  }
  
  &.user .bubble-container {
    .bubble {
      background-color: #e6f7ff;
      border-bottom-right-radius: 4px;
      color: #0050b3;
      
      &::before {
        right: -14px;
        border-left-color: #e6f7ff;
        border-right: 0;
      }
    }
  }
  
  &.assistant .bubble-container {
    .bubble {
      background-color: white;
      border-bottom-left-radius: 4px;
      
      &::before {
        left: -14px;
        border-right-color: white;
        border-left: 0;
      }
    }
    
    .loading-bubble {
      animation: pulse 2s infinite ease-in-out;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #666;
  padding: 20px;
  
  .empty-icon {
    margin-bottom: 20px;
    opacity: 0.6;
  }
  
  h3 {
    margin: 0 0 8px;
    color: #333;
    font-weight: 500;
  }
  
  p {
    margin-bottom: 32px;
    color: #999;
    font-size: 14px;
  }
  
  .example-prompts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    width: 100%;
    max-width: 600px;
    
    .example-prompt {
      background-color: #fff;
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      color: #555;
      text-align: left;
      
      &:hover {
        border-color: #1890ff;
        color: #1890ff;
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
      }
    }
  }
}

.reasoning {
  margin-bottom: 12px;
  border-bottom: 1px dashed #eaeaea;
  
  .reasoning-header {
    font-size: 12px;
    color: #1890ff;
    cursor: pointer;
    padding-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    opacity: 0.8;
    transition: all 0.2s ease;
    
    &:hover {
      opacity: 1;
    }
    
    .anticon {
      font-size: 11px;
    }
  }
  
  .reasoning-content {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    background-color: rgba(0, 0, 0, 0.02);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 10px;
    white-space: pre-wrap;
    // max-height: 200px;
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: #ddd;
      border-radius: 4px;
    }
  }
}

.message-content {
  line-height: 1.6;
  font-size: 14px;
  color: #333;
  
  :deep(.v-md-preview) {
    background-color: transparent !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }
  
  :deep(.v-md-preview-content) {
    padding: 0 !important;
  }
  
  :deep(.github-markdown-body) {
    background-color: transparent !important;
    padding: 0 !important;
  }
  
  :deep(.markdown-body) {
    background-color: transparent !important;
    padding: 0 !important;
  }
  
  :deep(pre) {
    background-color: #f6f8fa;
    border-radius: 6px;
    padding: 16px;
    margin: 12px 0;
    overflow: auto;
  }
  
  :deep(code) {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    font-size: 13px;
  }
  
  :deep(p) {
    margin: 0;
  }
  
  :deep(ul), :deep(ol) {
    padding-left: 20px;
    margin: 8px 0;
  }
  
  :deep(blockquote) {
    border-left: 4px solid #ddd;
    padding-left: 16px;
    color: #666;
    margin: 12px 0;
  }
  
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }
    
    th {
      background-color: #f6f8fa;
    }
  }
  
  :deep(img) {
    max-width: 100%;
    border-radius: 4px;
  }
  
  :deep(a) {
    color: #1890ff;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 16px 0 8px;
    font-weight: 600;
  }
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  padding: 6px 0;
  
  span {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin: 0 2px;
    background: #888;
    border-radius: 50%;
    animation: blink 1.4s infinite both;
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes blink {
  0% { opacity: 0.2; }
  20% { opacity: 1; }
  100% { opacity: 0.2; }
}

.chat-input {
  padding: 16px 20px;
  background-color: #fff;
  box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.03);
  
  .input-textarea {
    resize: none;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 14px;
    background-color: #f9f9f9;
    border-color: transparent;
    transition: all 0.3s;
    
    &:hover, &:focus {
      background-color: #fff;
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
  }
  
  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding: 0 4px;
    
    .action-btn {
      padding: 4px 8px;
      color: #999;
      
      &:hover {
        color: #1890ff;
        background: transparent;
      }
    }
    
    .send-btn {
      border-radius: 6px;
      font-size: 13px;
      padding: 0 16px;
      height: 32px;
    }
  }
}

.model-selector {
  display: flex;
  align-items: center;
  
  .model-btn {
    font-size: 13px;
    color: #666;
    padding: 0 8px;
    border-radius: 4px;
    
    &:hover {
      background-color: #f0f0f0;
    }
  }
}

.model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 140px;
  
  .model-name {
    font-size: 13px;
  }
}

.header-controls {
  display: flex;
  align-items: center;
  
  .stream-toggle {
    margin-right: 16px;
    display: flex;
    align-items: center;
    background-color: #f5f5f5;
    padding: 4px 8px;
    border-radius: 6px;
    
    .toggle-label {
      margin-right: 8px;
      font-size: 12px;
      color: #666;
    }
  }

  .multi-turn-toggle {
    margin-right: 16px;
    display: flex;
    align-items: center;
    background-color: #f5f5f5;
    padding: 4px 8px;
    border-radius: 6px;
    
    .toggle-label {
      margin-right: 8px;
      font-size: 12px;
      color: #666;
    }
  }
}
</style>