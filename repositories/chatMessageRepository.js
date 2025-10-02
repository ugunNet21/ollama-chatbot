// repositories/chatMessageRepository.js
const { pool } = require('../config/db');
const ChatMessage = require('../models/ChatMessage');

class ChatMessageRepository {
  async create(chatHistoryId, role, content) {
    // Validasi bahwa chatHistoryId adalah UUID yang valid
    if (!chatHistoryId || chatHistoryId === 'null') {
      throw new Error('Invalid chat history ID');
    }
    
    const message = new ChatMessage(chatHistoryId, role, content);
    await pool.query(
      'INSERT INTO chat_messages (id, chat_history_id, role, content) VALUES (?, ?, ?, ?)',
      [message.id, message.chatHistoryId, message.role, message.content]
    );
    return message;
  }

  async findByChatHistoryId(chatHistoryId) {
    const [rows] = await pool.query(
      'SELECT * FROM chat_messages WHERE chat_history_id = ? ORDER BY created_at ASC',
      [chatHistoryId]
    );
    return rows;
  }

  async deleteByChatHistoryId(chatHistoryId) {
    await pool.query('DELETE FROM chat_messages WHERE chat_history_id = ?', [chatHistoryId]);
  }
}

module.exports = new ChatMessageRepository();