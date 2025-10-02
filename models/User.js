// models/User.js
const { uuidv4 } = require('../config/db');

class User {
  constructor(username) {
    this.id = uuidv4();
    this.username = username;
  }
}

module.exports = User;