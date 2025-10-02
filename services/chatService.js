// services/chatService.js
const chatHistoryRepository = require('../repositories/chatHistoryRepository');
const chatMessageRepository = require('../repositories/chatMessageRepository');
const { ollamaApiRequest } = require('../utils/apiHelper');

class ChatService {
  async createChatHistory(userId, title) {
    return await chatHistoryRepository.create(userId, title);
  }

  async getUserChatHistories(userId) {
    return await chatHistoryRepository.findByUserId(userId);
  }

  async getChatMessages(chatHistoryId) {
    return await chatMessageRepository.findByChatHistoryId(chatHistoryId);
  }

  async sendMessage(userId, chatHistoryId, message, model = 'gemma3:1b') {
    // Validasi bahwa chat history ada dan milik user
    const chatHistory = await chatHistoryRepository.findById(chatHistoryId);
    if (!chatHistory || chatHistory.user_id !== userId) {
      throw new Error('Chat history not found or access denied');
    }
    
    // Save user message
    await chatMessageRepository.create(chatHistoryId, 'user', message);
    
    // Get chat history for context
    const messages = await chatMessageRepository.findByChatHistoryId(chatHistoryId);
    
    // Prepare messages for Ollama
    const ollamaMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Call Ollama API
    const payload = {
      model,
      messages: ollamaMessages,
      stream: false
    };
    
    const data = await ollamaApiRequest('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Save assistant response
    const reply = data.message.content;
    await chatMessageRepository.create(chatHistoryId, 'assistant', reply);
    
    return reply;
  }

  async deleteChatHistory(chatHistoryId) {
    await chatHistoryRepository.delete(chatHistoryId);
  }

  async updateChatTitle(chatHistoryId, title) {
    await chatHistoryRepository.updateTitle(chatHistoryId, title);
  }
}

module.exports = new ChatService();