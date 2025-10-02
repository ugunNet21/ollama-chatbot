// repositories/chatHistoryRepository.js
const { pool } = require('../config/db');
const ChatHistory = require('../models/ChatHistory');

class ChatHistoryRepository {
  async create(userId, title) {
    const chatHistory = new ChatHistory(userId, title);
    await pool.query(
      'INSERT INTO chat_histories (id, user_id, title) VALUES (?, ?, ?)',
      [chatHistory.id, chatHistory.userId, chatHistory.title]
    );
    return chatHistory;
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM chat_histories WHERE id = ?', [id]);
    return rows[0];
  }

  async findByUserId(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM chat_histories WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    return rows;
  }

  async updateTitle(id, title) {
    await pool.query(
      'UPDATE chat_histories SET title = ? WHERE id = ?',
      [title, id]
    );
  }

  async delete(id) {
    await pool.query('DELETE FROM chat_histories WHERE id = ?', [id]);
  }
}

module.exports = new ChatHistoryRepository();