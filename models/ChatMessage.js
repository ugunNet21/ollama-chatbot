// models/ChatMessage.js
const { uuidv4 } = require('../config/db');

class ChatMessage {
  constructor(chatHistoryId, role, content) {
    this.id = uuidv4();
    this.chatHistoryId = chatHistoryId;
    this.role = role;
    this.content = content;
  }
}

module.exports = ChatMessage;