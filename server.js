// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();

const PORT = process.env.APP_PORT || 3000;
const OLLAMA_API_URL = process.env.OLLAMA_API_BASE_URL;
const DEFAULT_MODEL = process.env.DEFAULT_OLLAMA_MODEL || 'gemma3:1b';

// Pastikan folder uploads ada
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

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
        // Ambil message dan model dari body, gunakan model default jika tidak ada
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
        // Error sudah di-log di dalam fungsi helper, jadi kita hanya kirim response
        res.status(500).json({ error: `Gagal memproses permintaan: ${error.message}` });
    }
});

// Endpoint untuk upload file - hanya menyimpan file dan mengembalikan informasi
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang diupload' });
        }

        const filePath = req.file.path;
        const fileName = req.file.originalname;
        const fileExtension = path.extname(fileName).toLowerCase();
        const fileSize = (req.file.size / 1024).toFixed(2) + ' KB';

        let result = {};

        // Handle text files
        if (['.txt', '.md', '.csv', '.json', '.xml'].includes(fileExtension)) {
            const content = fs.readFileSync(filePath, 'utf8');
            result = {
                type: 'text',
                fileName: fileName,
                fileSize: fileSize,
                content: content,
                message: `Saya telah menerima file "${fileName}" (${fileSize}). Apakah Anda ingin saya menganalisis atau merespons terkait konten ini?`
            };
        } 
        // Handle image files
        else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension)) {
            // Convert image to base64 untuk ditampilkan di frontend
            const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });
            const mimeType = req.file.mimetype;
            
            result = {
                type: 'image',
                fileName: fileName,
                fileSize: fileSize,
                image: `data:${mimeType};base64,${imageBase64}`,
                message: `Saya telah menerima gambar "${fileName}" (${fileSize}). Model saat ini tidak mendukung analisis gambar, tetapi Anda dapat bertanya tentang gambar ini.`
            };
        } else {
            return res.status(400).json({ error: 'Tipe file tidak didukung' });
        }

        // Clean up the uploaded file
        fs.unlinkSync(filePath);

        res.json(result);
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'Gagal memproses file' });
    }
});

// Endpoint untuk menganalisis file
app.post('/api/analyze-file', async (req, res) => {
    try {
        const { content, fileName, type } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Konten file tidak boleh kosong' });
        }

        // Persiapkan prompt berdasarkan tipe file
        let systemPrompt = '';
        if (type === 'text') {
            systemPrompt = `Anda adalah asisten AI yang membantu menganalisis dan merespons terkait konten file yang diberikan. 
            Formatkan respons Anda dengan jelas dan terstruktur. 
            Jika file berisi kode, berikan penjelasan tentang kode tersebut dengan format yang rapi. 
            Jika file berisi artikel, ringkas dan berikan poin-poin penting dengan format yang mudah dibaca. 
            Jika file berisi data, berikan analisis dasar dengan format yang terstruktur. 
            Gunakan bahasa Indonesia yang baik dan benar.`;
        }

        const payload = {
            model: DEFAULT_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Berikut adalah konten dari file "${fileName}":\n\n${content}` }
            ],
            stream: false
        };

        const data = await ollamaApiRequest('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        res.json({ reply: data.message.content });
    } catch (error) {
        console.error('Error analyzing file:', error);
        res.status(500).json({ error: 'Gagal menganalisis file' });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Terhubung ke Ollama API di: ${OLLAMA_API_URL}`);
    console.log(`Model default: ${DEFAULT_MODEL}`);
});