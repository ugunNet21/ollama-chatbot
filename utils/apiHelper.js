// utils/apiHelper.js
const OLLAMA_API_URL = process.env.OLLAMA_API_BASE_URL;

async function ollamaApiRequest(endpoint, options = {}) {
  const url = `${OLLAMA_API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API Error (${response.status}): ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error during Ollama API request to ${url}:`, error.message);
    throw error;
  }
}

module.exports = { ollamaApiRequest };