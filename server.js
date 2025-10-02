// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const PORT = process.env.APP_PORT || 3000;
const OLLAMA_API_URL = process.env.OLLAMA_API_BASE_URL;
const DEFAULT_MODEL = process.env.DEFAULT_OLLAMA_MODEL || 'gemma3:1b';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 3. Fungsi helper terpusat untuk berkomunikasi dengan Ollama API
 * Ini memisahkan logika API call dari route handler.
 */
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

// Endpoint untuk mendapatkan model yang tersedia
app.get('/api/models', async (req, res) => {
    try {
        const data = await ollamaApiRequest('/api/tags');
        res.json(data.models);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil model yang tersedia.' });
    }
});

// Endpoint untuk chat dengan Ollama
app.post('/api/chat', async (req, res) => {
    try {

        const { message, model = DEFAULT_MODEL } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Properti "message" tidak boleh kosong.' });
        }

        console.log('Mengirim permintaan ke Ollama:', { model, message });

        const payload = {
            model: model,
            messages: [{ role: "user", content: message }],
            stream: false
        };

        const data = await ollamaApiRequest('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Respons dari Ollama:', data);
        res.json({ reply: data.message.content });
    } catch (error) {
        res.status(500).json({ error: `Gagal memproses permintaan: ${error.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Terhubung ke Ollama API di: ${OLLAMA_API_URL}`);
    console.log(`Model default: ${DEFAULT_MODEL}`);
});