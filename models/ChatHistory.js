// models/ChatHistory.js
const { uuidv4 } = require('../config/db');

class ChatHistory {
  constructor(userId, title) {
    this.id = uuidv4();
    this.userId = userId;
    this.title = title;
  }
}

module.exports = ChatHistory;