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
        newChat: document.getElementById('newChat'),
        loginModal: document.getElementById('loginModal'),
        loginForm: document.getElementById('loginForm'),
        usernameInput: document.getElementById('usernameInput'),
        chatHistoryList: document.getElementById('chatHistoryList'),
        chatTitle: document.getElementById('chatTitle')
    };

    let selectedModel = 'gemma3:1b';
    let isLoading = false;
    let attachedFile = null;
    let currentUser = null;
    let authToken = null;
    let currentChatId = null;
    let chatHistories = [];

    // Check if user is logged in
    function checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        
        if (token && user) {
            authToken = token;
            currentUser = JSON.parse(user);
            elements.loginModal.style.display = 'none';
            loadChatHistories();
            // Jangan otomatis membuat chat baru di sini
        } else {
            elements.loginModal.style.display = 'flex';
        }
    }

    // Login form submission
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = elements.usernameInput.value.trim();
        
        if (!username) return;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            
            const data = await response.json();
            
            if (data.user && data.token) {
                currentUser = data.user;
                authToken = data.token;
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                elements.loginModal.style.display = 'none';
                loadChatHistories();
                createNewChat();
            } else {
                alert('Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed');
        }
    });

    // Create new chat
    async function createNewChat() {
        try {
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ title: 'New Chat' })
            });
            
            if (response.ok) {
                const chat = await response.json();
                currentChatId = chat.id;
                elements.messages.innerHTML = '';
                addMessage('Halo! Saya adalah asisten AI. Ada yang bisa saya bantu?', false);
                loadChatHistories();
            } else {
                const error = await response.json();
                alert('Failed to create new chat: ' + error.error);
            }
        } catch (error) {
            console.error('Create chat error:', error);
            alert('Failed to create new chat');
        }
    }    

    // Load chat histories
    async function loadChatHistories() {
        try {
            const response = await fetch('/api/chats', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (response.ok) {
                chatHistories = await response.json();
                renderChatHistories();
                
                // Jika tidak ada chat history, buat yang baru
                if (chatHistories.length === 0) {
                    createNewChat();
                } else if (!currentChatId) {
                    // Jika ada chat history tapi tidak ada currentChatId, pilih yang pertama
                    loadChat(chatHistories[0].id);
                }
            }
        } catch (error) {
            console.error('Load chat histories error:', error);
        }
    }

    // Render chat histories
    function renderChatHistories() {
        elements.chatHistoryList.innerHTML = '';
        
        chatHistories.forEach(chat => {
            const item = document.createElement('div');
            item.className = `chat-history-item ${chat.id === currentChatId ? 'active' : ''}`;
            item.innerHTML = `
                <div class="chat-history-title">${chat.title}</div>
                <div class="chat-history-actions">
                    <button class="delete-chat" data-id="${chat.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-chat')) {
                    loadChat(chat.id);
                }
            });
            
            elements.chatHistoryList.appendChild(item);
        });
        
        // Add delete event listeners
        document.querySelectorAll('.delete-chat').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const chatId = btn.getAttribute('data-id');
                
                if (confirm('Are you sure you want to delete this chat?')) {
                    try {
                        const response = await fetch(`/api/chats/${chatId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${authToken}` }
                        });
                        
                        if (response.ok) {
                            if (chatId === currentChatId) {
                                createNewChat();
                            } else {
                                loadChatHistories();
                            }
                        }
                    } catch (error) {
                        console.error('Delete chat error:', error);
                    }
                }
            });
        });
    }

    // Load specific chat
    async function loadChat(chatId) {
        try {
            const response = await fetch(`/api/chats/${chatId}/messages`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (response.ok) {
                const messages = await response.json();
                currentChatId = chatId;
                elements.messages.innerHTML = '';
                
                messages.forEach(msg => {
                    addMessage(msg.content, msg.role === 'user');
                });
                
                // Update chat title
                const chat = chatHistories.find(c => c.id === chatId);
                if (chat) {
                    elements.chatTitle.textContent = chat.title;
                }
                
                renderChatHistories();
            }
        } catch (error) {
            console.error('Load chat error:', error);
        }
    }

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
        
        // Pastikan currentChatId valid
        if (!currentChatId) {
            alert('Please start a new chat first');
            return;
        }
    
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
    
            const response = await fetch(`/api/chats/${currentChatId}/messages`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            });
    
            const data = await response.json();
            hideLoading();
    
            if (data.error) {
                addMessage(`❌ Error: ${data.error}`, false);
            } else {
                addMessage(data.reply, false, 'markdown');
                
                // Update chat title if it's the first message
                const chatMessages = elements.messages.querySelectorAll('.message');
                if (chatMessages.length <= 3) { // 1 bot message + 1 user message + 1 bot response
                    updateChatTitle(message.substring(0, 30) + (message.length > 30 ? '...' : ''));
                }
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
    

    // Update chat title
    async function updateChatTitle(title) {
        try {
            await fetch(`/api/chats/${currentChatId}/title`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ title })
            });
            
            elements.chatTitle.textContent = title;
            loadChatHistories();
        } catch (error) {
            console.error('Update chat title error:', error);
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
        if (confirm('Are you sure you want to clear the current chat?')) {
            createNewChat();
        }
    });

    elements.newChat.addEventListener('click', () => {
        createNewChat();
    });

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

    // Initialize app
    checkAuthStatus();
    loadModels();

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        currentUser = null;
        authToken = null;
        currentChatId = null;
        chatHistories = [];
        elements.loginModal.style.display = 'flex';
        elements.messages.innerHTML = '';
    });
});