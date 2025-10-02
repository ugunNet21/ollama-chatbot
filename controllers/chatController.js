// controllers/chatController.js
const chatService = require('../services/chatService');

class ChatController {
  async createChat(req, res) {
    try {
      const userId = req.user.userId;
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      const chatHistory = await chatService.createChatHistory(userId, title);
      res.status(201).json(chatHistory);
    } catch (error) {
      console.error('Create chat error:', error);
      res.status(500).json({ error: 'Failed to create chat' });
    }
  }

  async getUserChats(req, res) {
    try {
      const userId = req.user.userId;
      const chats = await chatService.getUserChatHistories(userId);
      res.json(chats);
    } catch (error) {
      console.error('Get user chats error:', error);
      res.status(500).json({ error: 'Failed to get chats' });
    }
  }

  async getChatMessages(req, res) {
    try {
      const { chatId } = req.params;
      const messages = await chatService.getChatMessages(chatId);
      res.json(messages);
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  }

  async sendMessage(req, res) {
    try {
      const { chatId } = req.params;
      const { message, model } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      // Validasi bahwa chatId adalah UUID yang valid
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(chatId)) {
        return res.status(400).json({ error: 'Invalid chat ID' });
      }
      
      const reply = await chatService.sendMessage(req.user.userId, chatId, message, model);
      res.json({ reply });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  async deleteChat(req, res) {
    try {
      const { chatId } = req.params;
      await chatService.deleteChatHistory(chatId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete chat error:', error);
      res.status(500).json({ error: 'Failed to delete chat' });
    }
  }

  async updateChatTitle(req, res) {
    try {
      const { chatId } = req.params;
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      await chatService.updateChatTitle(chatId, title);
      res.json({ success: true });
    } catch (error) {
      console.error('Update chat title error:', error);
      res.status(500).json({ error: 'Failed to update chat title' });
    }
  }
}

module.exports = new ChatController();