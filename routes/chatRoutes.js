// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const chatController = require('../controllers/chatController');

router.use(authMiddleware);

router.post('/', chatController.createChat);
router.get('/', chatController.getUserChats);
router.get('/:chatId/messages', chatController.getChatMessages);
router.post('/:chatId/messages', chatController.sendMessage);
router.delete('/:chatId', chatController.deleteChat);
router.put('/:chatId/title', chatController.updateChatTitle);

module.exports = router;