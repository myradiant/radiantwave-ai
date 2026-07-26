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

    container.innerHTML = CONFIG.personalities.map(p =>
      `<button class="personality-chip ${p.id === this.currentPersonality.id ? 'active' : ''}"
              data-personality="${p.id}"
              onclick="Chat.setPersonality('${p.id}')">
        <span class="personality-chip-icon">${p.icon}</span>
        <span>${p.name}</span>
      </button>`
    ).join('');
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
        <div class="welcome-logo">&#127754;</div>
        <h1 class="welcome-title gradient-text">RadiantWaves AI</h1>
        <p class="welcome-subtitle">How can I help you today? Choose a personality above or just start typing.</p>
        <div class="welcome-suggestions">
          <div class="welcome-suggestion" data-prompt="Explain quantum computing in simple terms">
            <div class="welcome-suggestion-icon">&#9883;&#65039;</div>
            <div class="welcome-suggestion-text">Explain quantum computing in simple terms</div>
          </div>
          <div class="welcome-suggestion" data-prompt="Write a professional email to request time off">
            <div class="welcome-suggestion-icon">&#9993;&#65039;</div>
            <div class="welcome-suggestion-text">Write a professional email requesting time off</div>
          </div>
          <div class="welcome-suggestion" data-prompt="Debug this Python function that sorts a list">
            <div class="welcome-suggestion-icon">&#128027;</div>
            <div class="welcome-suggestion-text">Debug a Python sorting function</div>
          </div>
          <div c…
