// services/modelService.js
const { ollamaApiRequest } = require('../utils/apiHelper');

class ModelService {
  async getAvailableModels() {
    const data = await ollamaApiRequest('/api/tags');
    return data.models;
  }
}

module.exports = new ModelService();