// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        messages: document.getElementById('chatMessages'),
        input: document.getElementById('messageInput'),
        sendBtn: document.getElementById('sendButton'),
        fileBtn: document.getElementById('fileButton'),
        fileInput: document.getElementById('fileInput'),
        modelList: document.getElementById('modelList'),
        currentModel: document.getElementById('currentModel'),
        currentModelMobile: document.getElementById('currentModelMobile'),
        modelDetails: document.getElementById('modelDetails'),
        clearChat: document.getElementById('clearChat'),
        newChat: document.getElementById('newChat')
    };

    let selectedModel = 'gemma3:1b';
    let isLoading = false;
    let attachedFile = null;

    // Parse markdown dengan copy button
    function parseMarkdown(text) {
        // Replace code blocks dengan syntax highlighting dan copy button
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const cleanCode = code.trim();
            return `<div class="code-block">
                <div class="code-header">
                    <span class="code-lang">${lang || 'code'}</span>
                    <button class="copy-code-btn" onclick="copyCode(this, \`${cleanCode.replace(/`/g, '\\`')}\`)">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <pre><code class="language-${lang || ''}">${cleanCode}</code></pre>
            </div>`;
        });

        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        
        // Bold text
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Italic text
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Lists - improved
        text = text.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
        text = text.replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>');
        
        // Numbered lists
        text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        
        // Line breaks dan paragraphs
        text = text.split('\n\n').map(para => {
            if (para.startsWith('<ul>') || para.startsWith('<div class="code-block">')) {
                return para;
            }
            return `<p>${para.replace(/\n/g, '<br>')}</p>`;
        }).join('');
        
        return text;
    }

    // Global function untuk copy code
    window.copyCode = function(btn, code) {
        navigator.clipboard.writeText(code).then(() => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('copied');
            }, 2000);
        });
    };

    function addMessage(text, isUser = false, type = 'text') {
        const msg = document.createElement('div');
        msg.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const content = type === 'markdown' ? parseMarkdown(text) : text;
        
        msg.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
                </div>
                <div class="message-text">${content}</div>
            </div>
            <div class="message-time">${time}</div>
        `;
        
        elements.messages.appendChild(msg);
        elements.messages.scrollTop = elements.messages.scrollHeight;
    }

    function showAttachedFile(file) {
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        preview.innerHTML = `
            <div class="file-preview-content">
                <i class="fas ${file.type === 'image' ? 'fa-image' : 'fa-file-alt'}"></i>
                <span class="file-name">${file.fileName}</span>
                <span class="file-size">${file.fileSize}</span>
                <button class="remove-file" onclick="this.parentElement.parentElement.remove(); attachedFile = null;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${file.type === 'image' ? `<img src="${file.image}" alt="preview">` : ''}
        `;
        
        const existing = document.querySelector('.file-preview');
        if (existing) existing.remove();
        
        elements.input.parentElement.insertBefore(preview, elements.input);
    }

    function showLoading() {
        if (isLoading) return;
        isLoading = true;
        
        const loading = document.createElement('div');
        loading.id = 'loadingMessage';
        loading.className = 'message bot-message loading';
        loading.innerHTML = `
            <div class="message-content">
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-text">
                    <span class="typing-dots">
                        <span></span><span></span><span></span>
                    </span>
                </div>
            </div>
        `;
        
        elements.messages.appendChild(loading);
        elements.messages.scrollTop = elements.messages.scrollHeight;
    }

    function hideLoading() {
        const loading = document.getElementById('loadingMessage');
        if (loading) {
            loading.remove();
            isLoading = false;
        }
    }

    async function sendMessage() {
        const message = elements.input.value.trim();
        if (!message && !attachedFile) return;

        // Tampilkan pesan user dengan file info jika ada
        let userMessage = message;
        if (attachedFile) {
            if (attachedFile.type === 'image') {
                userMessage += `<br><div class="user-file-tag"><i class="fas fa-image"></i> ${attachedFile.fileName}</div>`;
            } else {
                userMessage += `<br><div class="user-file-tag"><i class="fas fa-file-alt"></i> ${attachedFile.fileName}</div>`;
            }
        }
        
        if (userMessage) addMessage(userMessage, true);

        elements.input.value = '';
        elements.input.style.height = 'auto';
        
        showLoading();

        try {
            const payload = {
                message: message || 'Analisis file ini secara detail',
                model: selectedModel
            };

            // PENTING: Kirim file content ke backend
            if (attachedFile) {
                if (attachedFile.content) {
                    payload.fileContent = attachedFile.content;
                    payload.fileName = attachedFile.fileName;
                }
                // Untuk image, kirimkan informasi bahwa ini adalah gambar
                if (attachedFile.type === 'image') {
                    payload.fileContent = `[File gambar: ${attachedFile.fileName}]`;
                    payload.fileName = attachedFile.fileName;
                }
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            hideLoading();

            if (data.error) {
                addMessage(`❌ Error: ${data.error}`, false);
            } else {
                addMessage(data.reply, false, 'markdown');
            }

            // Reset attached file
            attachedFile = null;
            const preview = document.querySelector('.file-preview');
            if (preview) preview.remove();

        } catch (error) {
            console.error('Error:', error);
            hideLoading();
            addMessage('❌ Maaf, terjadi kesalahan. Silakan coba lagi.', false);
        }
    }

    // Event listeners
    elements.sendBtn.addEventListener('click', sendMessage);
    
    elements.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    elements.input.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    elements.fileBtn.addEventListener('click', () => elements.fileInput.click());

    elements.fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showLoading();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            hideLoading();

            if (result.error) {
                addMessage(`Error: ${result.error}`, false);
            } else {
                attachedFile = result;
                showAttachedFile(result);
            }

            elements.fileInput.value = '';
        } catch (error) {
            console.error('Error:', error);
            hideLoading();
            addMessage('Gagal mengunggah file.', false);
        }
    });

    elements.clearChat.addEventListener('click', () => {
        elements.messages.innerHTML = `
            <div class="message bot-message">
                <div class="message-content">
                    <div class="message-avatar"><i class="fas fa-robot"></i></div>
                    <div class="message-text">Chat dihapus. Ada yang bisa saya bantu?</div>
                </div>
                <div class="message-time">Baru saja</div>
            </div>
        `;
    });

    elements.newChat.addEventListener('click', () => elements.clearChat.click());

    // Load models
    async function loadModels() {
        try {
            const response = await fetch('/api/models');
            const models = await response.json();
            
            elements.modelList.innerHTML = '';
            
            models.forEach(model => {
                const item = document.createElement('div');
                item.className = `model-item ${model.name === selectedModel ? 'active' : ''}`;
                
                item.innerHTML = `
                    <div class="model-name">${model.name}</div>
                    <div class="model-meta">
                        <span class="model-size">${model.details.parameter_size || 'Unknown'}</span>
                        <span class="model-quant">${model.details.quantization_level || 'Unknown'}</span>
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    selectedModel = model.name;
                    elements.currentModel.textContent = model.name;
                    elements.currentModelMobile.textContent = model.name;
                    
                    document.querySelectorAll('.model-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    
                    elements.modelDetails.innerHTML = `
                        <strong>${model.name}</strong><br>
                        Ukuran: ${model.details.parameter_size || 'Unknown'}<br>
                        Kuantisasi: ${model.details.quantization_level || 'Unknown'}<br>
                        Modified: ${new Date(model.modified_at).toLocaleString()}
                    `;
                });
                
                elements.modelList.appendChild(item);
            });

            if (models.length > 0) {
                const first = models[0];
                elements.modelDetails.innerHTML = `
                    <strong>${first.name}</strong><br>
                    Ukuran: ${first.details.parameter_size || 'Unknown'}<br>
                    Kuantisasi: ${first.details.quantization_level || 'Unknown'}<br>
                    Modified: ${new Date(first.modified_at).toLocaleString()}
                `;
            }
        } catch (error) {
            console.error('Error loading models:', error);
            elements.modelList.innerHTML = '<div class="error-message">Gagal memuat model</div>';
        }
    }

    loadModels();
});