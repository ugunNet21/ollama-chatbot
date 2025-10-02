// services/authService.js
const userRepository = require('../repositories/userRepository');
const jwt = require('jsonwebtoken');

class AuthService {
  async loginOrRegister(username) {
    let user = await userRepository.findByUsername(username);
    
    if (!user) {
      user = await userRepository.create(username);
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    return { user, token };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return null;
    }
  }
}

module.exports = new AuthService();