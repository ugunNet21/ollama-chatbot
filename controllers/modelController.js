// controllers/modelController.js
const modelService = require('../services/modelService');

class ModelController {
  async getModels(req, res) {
    try {
      const models = await modelService.getAvailableModels();
      res.json(models);
    } catch (error) {
      console.error('Get models error:', error);
      res.status(500).json({ error: 'Failed to get models' });
    }
  }
}

module.exports = new ModelController();