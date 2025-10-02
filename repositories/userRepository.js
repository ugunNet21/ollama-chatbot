// repositories/userRepository.js
const { pool } = require('../config/db');
const User = require('../models/User');

class UserRepository {
  async create(username) {
    const user = new User(username);
    await pool.query(
      'INSERT INTO users (id, username) VALUES (?, ?)',
      [user.id, user.username]
    );
    return user;
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }
}

module.exports = new UserRepository();