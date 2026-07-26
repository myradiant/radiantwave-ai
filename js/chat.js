const Chat = {
  currentConversationId: null,
  currentPersonality: CONFIG.personalities[0],
  messages: [],
  isTyping: false,
  messagesContainer: null,
  inputElement: null,

  init: function() {
    this.messagesContainer = document.getElementById('chat-messages');
    this.inputElement = document.getElementById('chat-input');
    this.renderPersonalitySelector();
    this.bindEvents();
    this.showWelcome();

    var lastConv = Utils.storage.get('lastConversation');
    if (lastConv) this.loadConversation(lastConv);
  },

  bindEvents: function() {
    if (this.inputElement) {
      this.inputElement.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          Chat.sendMessage();
        }
      });
      this.inputElement.addEventListener('input', function() {
        Chat.inputElement.style.height = 'auto';
        Chat.inputElement.style.height = Math.min(Chat.inputElement.scrollHeight, 200) + 'px';
      });
    }

    var sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.addEventListener('click', function() { Chat.sendMessage(); });
  },

  renderPersonalitySelector: function() {
    var container = document.getElementById('personality-selector');
    if (!container) return;

    var html = '';
    for (var i = 0; i < CONFIG.personalities.length; i++) {
      var p = CONFIG.personalities[i];
      var activeClass = (p.id === this.currentPersonality.id) ? 'active' : '';
      html += '<button class="personality-chip ' + activeClass + '" data-personality="' + p.id + '" onclick="Chat.setPersonality(\'' + p.id + '\')">';
      html += '<span class="personality-chip-icon">' + p.icon + '</span>';
      html += '<span>' + p.name + '</span>';
      html += '</button>';
    }
    container.innerHTML = html;
  },

  setPersonality: function(id) {
    var personality = null;
    for (var i = 0; i < CONFIG.personalities.length; i++) {
      if (CONFIG.personalities[i].id === id) {
        personality = CONFIG.personalities[i];
        break;
      }
    }
    if (!personality) return;

    this.currentPersonality = personality;
    this.renderPersonalitySelector();

    var title = document.getElementById('top-bar-title');
    if (title) title.innerHTML = personality.icon + ' ' + personality.name;

    Utils.toast('Switched to ' + personality.name, 'info');
  },

  loadConversation: async function(id) {
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

  clearChat: function() {
    this.currentConversationId = null;
    this.messages = [];
    Utils.storage.remove('lastConversation');
    this.showWelcome();
  },

  showWelcome: function() {
    if (!this.messagesContainer) return;

    var html = '<div class="welcome-screen">';
    html += '<div class="welcome-logo">RW</div>';
    html += '<h1 class="welcome-title gradient-text">RadiantWaves AI</h1>';
    html += '<p class="welcome-subtitle">How can I help you today? Choose a personality above or just start typing.</p>';
    html += '<div class="welcome-suggestions">';
    html += '<div class="welcome-suggestion" data-prompt="Explain quantum computing in simple terms"><div class="welcome-suggestion-icon">Q</div><div class="welcome-suggestion-text">Explain quantum computing in simple terms</div></div>';
    html += '<div class="welcome-suggestion" data-prompt="Write a professional email to request time off"><div class="welcome-suggestion-icon">@</div><div class="welcome-suggestion-text">Write a professional email requesting time off</div></div>';
    html += '<div class="welcome-suggestion" data-prompt="Debug this Python function that sorts a list"><div class="welcome-suggestion-icon">B</div><div class="welcome-suggestion-text">Debug a Python sorting function</div></div>';
    html += '<div class="welcome-suggestion" data-prompt="Create a business plan for a coffee shop"><div class="welcome-suggestion-icon">P</div><div class="welcome-suggestion-text">Create a business plan for a coffee shop</div></div>';
    html += '</div></div>';

    this.messagesContainer.innerHTML = html;

    var suggestions = document.querySelectorAll('.welcome-suggestion');
    for (var i = 0; i < suggestions.length; i++) {
      suggestions[i].addEventListener('click', function() {
        var text = this.dataset.prompt;
        if (text && Chat.inputElement) {
          Chat.inputElement.value = text;
          Chat.sendMessage();
        }
      });
    }
  },

  renderMessages: function() {
    if (!this.messagesContainer) return;
    if (this.messages.length === 0) {
      this.showWelcome();
      return;
    }

    var html = '';
    for (var i = 0; i < this.messages.length; i++) {
      html += this.createMessageHTML(this.messages[i]);
    }
    this.messagesContainer.innerHTML = html;
    this.scrollToBottom();
  },

  createMessageHTML: function(msg) {
    var isUser = msg.role === 'user';
    var avatar = isUser ? 'You' : this.currentPersonality.icon;
    var name = isUser ? 'You' : this.currentPersonality.name;
    var time = Utils.formatTime(msg.created_at);
    var content = Utils.renderMarkdown(msg.content);

    var html = '<div class="message" data-msg-id="' + msg.id + '">';
    html += '<div class="message-avatar ' + (isUser ? 'user' : 'ai') + '">' + avatar + '</div>';
    html += '<div class="message-content">';
    html += '<div class="message-header">';
    html += '<span class="message-author">' + name + '</span>';
    html += '<span class="message-time">' + time + '</span>';
    html += '</div>';
    html += '<div class="message-body">' + content + '</div>';
    html += '</div></div>';
    return html;
  },

  sendMessage: async function() {
    if (this.isTyping) return;

    var text = this.inputElement ? this.inputElement.value.trim() : '';
    if (!text) return;

    this.inputElement.value = '';
    this.inputElement.style.height = 'auto';

    if (!this.currentConversationId) {
      var authResult = await supabaseClient.auth.getUser();
      var user = authResult.data.user;

      if (!user) {
        Utils.toast('Please sign in first', 'error');
        return;
      }

      try {
        var conv = await DB.createConversation(user.id, Utils.truncate(text, 40), this.currentPersonality.id);
        this.currentConversationId = conv.id;
        Utils.storage.set('lastConversation', conv.id);
        if (Sidebar.loadConversations) Sidebar.loadConversations();
      } catch (err) {
        console.error('createConversation failed:', err);
        Utils.toast('Failed to start conversation', 'error');
        return;
      }
    }

    var userMsg = {
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

  getAIResponse: async function(userText) {
    this.isTyping = true;
    var sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.disabled = true;

    var typingId = 'typing-' + Utils.generateId();
    var html = '<div class="message" id="' + typingId + '">';
    html += '<div class="message-avatar ai">' + this.currentPersonality.icon + '</div>';
    html += '<div class="message-content">';
    html += '<div class="message-header"><span class="message-author">' + this.currentPersonality.name + '</span></div>';
    html += '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    html += '</div></div>';

    var welcome = this.messagesContainer.querySelector('.welcome-screen');
    if (welcome) welcome.remove();

    this.messagesContainer.insertAdjacentHTML('beforeend', html);
    this.scrollToBottom();

    try {
      var response = await this.callBackend(userText);
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

 callBackend: async function(userText) {
    var url = CONFIG.supabase.url.replace(/\/$/, '') + '/functions/v1/smart-api';
    console.log('Calling Edge Function at:', url);

    var response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.supabase.anonKey
      },
      body: JSON.stringify({
        message: userText,
        personality: this.currentPersonality.name
      })
    });

    console.log('Edge Function status:', response.status);

    if (!response.ok) {
      var errText = await response.text();
      console.error('Edge Function error:', errText);
      throw new Error('HTTP ' + response.status + ': ' + errText);
    }

    var data = await response.json();
    console.log('Edge Function response:', data);
    return data.response || 'No response received.';
  },

  getFallbackResponse: function(text) {
    var lower = text.toLowerCase();

    if (lower.indexOf('hello') >= 0 || lower.indexOf('hi') >= 0) {
      return 'Hello! I am ' + this.currentPersonality.name + '. How can I assist you today?';
    }
    if (lower.indexOf('code') >= 0 || lower.indexOf('python') >= 0 || lower.indexOf('javascript') >= 0) {
      return 'I would love to help with your code! However, my backend connection is not active right now.';
    }
    if (lower.indexOf('business') >= 0 || lower.indexOf('plan') >= 0) {
      return 'Great business question! To give you the best strategic advice, I need my backend connected.';
    }

    return 'Thanks for your message! I am currently running in frontend-only mode. Your message was: "' + text + '"';
  },

  addAIMessage: async function(content) {
    var aiMsg = {
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

  removeTypingIndicator: function(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  },

  scrollToBottom: function() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }
};

window.Chat = Chat;
