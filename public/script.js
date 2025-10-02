document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const modelList = document.getElementById('modelList');
    const currentModel = document.getElementById('currentModel');
    const currentModelMobile = document.getElementById('currentModelMobile');
    const modelDetails = document.getElementById('modelDetails');
    const clearChatButton = document.getElementById('clearChat');
    const newChatButton = document.getElementById('newChat');
    
    let selectedModel = 'gemma3:1b';
    let isLoading = false;

    // Fungsi untuk menambah pesan ke chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
                </div>
                <div class="message-text">${text}</div>
            </div>
            <div class="message-time">${currentTime}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Fungsi untuk menampilkan loading indicator
    function showLoading() {
        if (isLoading) return;
        
        isLoading = true;
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message loading';
        loadingDiv.id = 'loadingMessage';
        loadingDiv.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-text">
                    <span class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </div>
            </div>
        `;
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Fungsi untuk menghapus loading indicator
    function hideLoading() {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.remove();
            isLoading = false;
        }
    }

    // Fungsi untuk mengirim pesan ke server
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || isLoading) return;

        // Tambah pesan user ke chat
        addMessage(message, true);
        messageInput.value = '';
        
        // Tampilkan loading indicator
        showLoading();

        try {
            // Kirim pesan ke backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    model: selectedModel
                })
            });

            const data = await response.json();
            
            // Hapus indikator loading
            hideLoading();
            
            // Tambah balasan bot
            if (data.error) {
                addMessage(`Error: ${data.error}`);
            } else {
                addMessage(data.reply);
            }
        } catch (error) {
            console.error('Error:', error);
            hideLoading();
            addMessage('Maaf, terjadi kesalahan. Silakan coba lagi.');
        }
    }

    // Event listener untuk tombol kirim
    sendButton.addEventListener('click', sendMessage);

    // Event listener untuk enter key
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Fungsi untuk memuat model yang tersedia
    async function loadAvailableModels() {
        try {
            const response = await fetch('/api/models');
            const models = await response.json();
            
            // Kosongkan model list
            modelList.innerHTML = '';
            
            // Tambahkan model yang tersedia
            models.forEach(model => {
                const modelItem = document.createElement('div');
                modelItem.className = 'model-item';
                if (model.name === selectedModel) {
                    modelItem.classList.add('active');
                }
                
                const modelSize = model.details.parameter_size || 'Unknown';
                const quantization = model.details.quantization_level || 'Unknown';
                
                modelItem.innerHTML = `
                    <div class="model-name">${model.name}</div>
                    <div class="model-meta">
                        <span class="model-size">${modelSize}</span>
                        <span class="model-quant">${quantization}</span>
                    </div>
                `;
                
                modelItem.addEventListener('click', () => {
                    selectedModel = model.name;
                    currentModel.textContent = model.name;
                    currentModelMobile.textContent = model.name;
                    
                    // Update active state
                    document.querySelectorAll('.model-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    modelItem.classList.add('active');
                    
                    // Update model info
                    modelDetails.innerHTML = `
                        <strong>${model.name}</strong><br>
                        Ukuran: ${modelSize}<br>
                        Kuantisasi: ${quantization}<br>
                        Modified: ${new Date(model.modified_at).toLocaleString()}
                    `;
                });
                
                modelList.appendChild(modelItem);
            });
            
            // Set model info untuk model pertama
            if (models.length > 0) {
                const firstModel = models[0];
                modelDetails.innerHTML = `
                    <strong>${firstModel.name}</strong><br>
                    Ukuran: ${firstModel.details.parameter_size || 'Unknown'}<br>
                    Kuantisasi: ${firstModel.details.quantization_level || 'Unknown'}<br>
                    Modified: ${new Date(firstModel.modified_at).toLocaleString()}
                `;
            }
        } catch (error) {
            console.error('Gagal memuat model:', error);
            modelList.innerHTML = '<div class="error-message">Gagal memuat model</div>';
        }
    }

    // Fungsi untuk menghapus chat
    function clearChat() {
        chatMessages.innerHTML = `
            <div class="message bot-message">
                <div class="message-content">
                    <div class="message-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-text">
                        Chat dihapus. Ada yang bisa saya bantu?
                    </div>
                </div>
                <div class="message-time">Baru saja</div>
            </div>
        `;
    }

    // Event listener untuk tombol clear chat
    clearChatButton.addEventListener('click', clearChat);

    // Event listener untuk tombol new chat
    newChatButton.addEventListener('click', clearChat);

    // Muat model yang tersedia saat halaman dimuat
    loadAvailableModels();
});