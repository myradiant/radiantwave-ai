const Chat = {
  currentConversationId: null,
  currentPersonality: CONFIG.personalities[0],
  messages: [],
  isTyping: false,
  messagesContainer: null,
  inputElement: null,

  init() {
    this.messagesContainer = document.getElementById('chat-messages');
    this.inputElement = document.getElementById('chat-input');
    this.renderPersonalitySelector();
    this.bindEvents();
    this.showWelcome();

    const lastConv = Utils.storage.get('lastConversation');
    if (lastConv) this.loadConversation(lastConv);
  },

  bindEvents() {
    if (this.inputElement) {
      this.inputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      this.inputElement.addEventListener('input', () => {
        this.inputElement.style.height = 'auto';
        this.inputElement.style.height = Math.min(this.inputElement.scrollHeight, 200) + 'px';
      });
    }

    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
  },

  renderPersonalitySelector() {
    const container = document.getElementById('personality-selector');
    if (!container) return;

    container.innerHTML = CONFIG.personalities.map(p => `
      <button class="personality-chip ${p.id === this.currentPersonality.id ? 'active' : ''}"
              data-personality="${p.id}"
              onclick="Chat.setPersonality('${p.id}')">
        <span class="personality-chip-icon">${p.icon}</span>
        <span>${p.name}</span>
      </button>
    `).join('');
  },

  setPersonality(id) {
    const personality = CONFIG.personalities.find(p => p.id === id);
    if (!personality) return;

    this.currentPersonality = personality;
    this.renderPersonalitySelector();

    const title = document.getElementById('top-bar-title');
    if (title) title.innerHTML = ${personality.icon} ${personality.name};

    Utils.toast(Switched to ${personality.name}, 'info');
  },

  async loadConversation(id) {
    try {
      this.messages = await DB.getMessages(id);
      this.currentConversationId = id;
      Utils.storage.set('lastConversation', id);
      if (Sidebar.setActiveConversation) Sidebar.setActiveConversation(id);
      this.renderMessages();
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  },

  clearChat() {
    this.currentConversationId = null;
    this.messages = [];
    Utils.storage.remove('lastConversation');
    this.showWelcome();
  },

  showWelcome() {
    if (!this.messagesContainer) return;

    this.messagesContainer.innerHTML = `
      <div class="welcome-screen">
        <div class="welcome-logo">🌊</div>
        <h1 class="welcome-title gradient-text">RadiantWaves AI</h1>
        <p class="welcome-subtitle">How can I help you today? Choose a personality above or just start typing.</p>
        <div class="welcome-suggestions">
          <div class="welcome-suggestion" data-prompt="Explain quantum computing in simple terms">
            <div class="welcome-suggestion-icon">⚛️</div>
            <div class="welcome-suggestion-text">Explain quantum computing in simple terms</div>
          </div>
          <div class="welcome-suggestion" data-prompt="Write a professional email to request time off">
            <div class="welcome-suggestion-icon">✉️</div>
            <div class="welcome-suggestion-text">Write a professional email requesting time off</div>
          </div>
          <div class="welcome-suggestion" data-prompt="Debug this Python function that sorts a list">
            <div class="welcome-suggestion-icon">🐛</div>
            <div class="welcome-suggestion-text">Debug a Python sorting function</div>
          </div>
          <div class="welcome-suggestion" data-prompt="Create a business plan for a coffee shop">
            <div class="welcome-suggestion-icon">📋</div>
            <div class="welcome-suggestion-text">Create a business plan for a coffee shop</div>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.welcome-suggestion').forEach(el => {
      el.addEventListener('click', () => {
        const text = el.dataset.prompt;
        if (text && this.inputElement) {
          this.inputElement.value = text;
          this.sendMessage();
        }
      });
    });
  },

  renderMessages() {
    if (!this.messagesContainer) return;
    if (this.messages.length === 0) {
      this.showWelcome();
      return;
    }

    this.messagesContainer.innerHTML = this.messages.map(msg => this.createMessageHTML(msg)).join('');
    this.scrollToBottom();
  },

  createMessageHTML(msg) {
    const isUser = msg.role === 'user';
    const avatar = isUser ? '👤' : this.currentPersonality.icon;
    const name = isUser ? 'You' : this.currentPersonality.name;
    const time = Utils.formatTime(msg.created_at);
    const content = Utils.renderMarkdown(msg.content);

    return `
      <div class="message" data-msg-id="${msg.id}">
        <div class="message-avatar ${isUser ? 'user' : 'ai'}">${avatar}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">${name}</span>
            <span class="message-time">${time}</span>
          </div>
          <div class="message-body">${content}</div>
        </div>
      </div>
    `;
  },

  async sendMessage() {
    if (this.isTyping) return;

    const text = this.inputElement?.value.trim();
    if (!text) return;

    this.inputElement.value = '';
    this.inputElement.style.height = 'auto';

    if (!this.currentConversationId) {
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) {
        Utils.toast('Please sign in first', 'error');
        return;
      }

      try {
        const conv = await DB.createConversation(
          user.id,
          Utils.truncate(text, 40),
          this.currentPersonality.id
        );
        this.currentConversationId = conv.id;
        Utils.storage.set('lastConversation', conv.id);
        if (Sidebar.loadConversations) Sidebar.loadConversations();
      } catch (err) {
        console.error('createConversation failed:', err);
        Utils.toast('Failed to start conversation', 'error');
        return;
      }
    }

    const userMsg = {
      id: Utils.generateId(),
      conversation_id: this.currentConversationId,
      role: 'user',
      content: text,
      personality_id: this.currentPersonality.id,
      created_at: new Date().toISOString()
    };

    this.messages.push(userMsg);
    this.renderMessages();

    try {
      await DB.saveMessage(this.currentConversationId, 'user', text, this.currentPersonality.id);
    } catch (err) {
      console.error('Failed to save message:', err);
    }

    if (this.messages.length === 1) {
      try {
        await DB.updateConversation(this.currentConversationId, { title: Utils.truncate(text, 40) });
        if (Sidebar.loadConversations) Sidebar.loadConversations();
      } catch (err) {
        console.error('Failed to update title:', err);
      }
    }

    await this.getAIResponse(text);
  },

  async getAIResponse(userText) {
    this.isTyping = true;
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.disabled = true;

    const typingId = 'typing-' + Utils.generateId();
    const typingHTML = `
      <div class="message" id="${typingId}">
        <div class="message-avatar ai">${this.currentPersonality.icon}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">${this.currentPersonality.name}</span>
          </div>
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    `;

    const welcome = this.messagesContainer.querySelector('.welcome-screen');
    if (welcome) welcome.remove();

    this.messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
    this.scrollToBottom();

    try {
      const response = await this.callBackend(userText);
      this.removeTypingIndicator(typingId);
      await this.addAIMessage(response);
    } catch (err) {
      console.error('Backend failed, using fallback:', err);
      this.removeTypingIndicator(typingId);
      await this.addAIMessage(this.getFallbackResponse(userText));
    }

    this.isTyping = false;
    if (sendBtn) sendBtn.disabled = false;
  },

  async callBackend(userText) {
    const response = await fetch(${CONFIG.api.baseUrl}/chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        personality: this.currentPersonality.id,
        conversation_id: this.currentConversationId,
        history: this.messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      })
    });

    if (!response.ok) throw new Error(HTTP ${response.status});
    const data = await response.json();
    return data.response || data.message || 'No response received.';
  },

  getFallbackResponse(text) {
    const lower = text.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi')) {
      return Hello! I'm ${this.currentPersonality.name}. How can I assist you today?;
    }
    if (lower.includes('code') || lower.includes('python') || lower.includes('javascript')) {
      return I'd love to help with your code! However, my backend connection isn't active right now. Please connect your backend API to get full code assistance.\n\nIn the meantime, here's a tip: Make sure to check your API endpoint at \${CONFIG.api.baseUrl}\.;
    }
    if (lower.includes('business') || lower.includes('plan')) {
      return Great business question! To give you the best strategic advice, I need my backend connected.\n\n**Quick checklist for your business plan:**\n- Executive Summary\n- Market Analysis\n- Organization & Management\n- Service/Product Line\n- Marketing & Sales Strategy\n- Financial Projections;
    }

    return Thanks for your message! I'm currently running in frontend-only mode.\n\nTo get full AI responses, please:\n1. Start the backend server: \`python backend/main.py\\n2. Update \js/config.js\ with your API keys\n3. Refresh the page\n\nYour message was: "${text}"`;
  },

  async addAIMessage(content) {
    const aiMsg = {
      id: Utils.generateId(),
      conversation_id: this.currentConversationId,
      role: 'assistant',
      content: content,
      personality_id: this.currentPersonality.id,
      created_at: new Date().toISOString()
    };

    this.messages.push(aiMsg);
    this.renderMessages();

    try {
      await DB.saveMessage(this.currentConversationId, 'assistant', content, this.currentPersonality.id);
    } catch (err) {
      console.error('Failed to save AI message:', err);
    }
  },

  removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }
};

window.Chat = Chat;
