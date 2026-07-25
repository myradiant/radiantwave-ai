const Sidebar = {
  element: null, conversations: [], currentConversationId: null,
  init() {
    this.element = document.getElementById('sidebar'); if (!this.element) return;
    this.render(); this.bindEvents();
    Auth.onAuthChange((user) => { this.renderUser(user); if (user) this.loadConversations(); });
  },
  bindEvents() {
    const toggle = document.getElementById('mobile-toggle'); const overlay = document.getElementById('sidebar-overlay');
    if (toggle) toggle.addEventListener('click', () => this.toggle()); if (overlay) overlay.addEventListener('click', () => this.close());
    const newChatBtn = document.getElementById('new-chat-btn'); if (newChatBtn) newChatBtn.addEventListener('click', () => this.createNewChat());
  },
  toggle() { this.element.classList.toggle('open'); const overlay = document.getElementById('sidebar-overlay'); if (overlay) overlay.classList.toggle('active'); },
  close() { this.element.classList.remove('open'); const overlay = document.getElementById('sidebar-overlay'); if (overlay) overlay.classList.remove('active'); },
  async loadConversations() {
    const user = Auth.getUser(); if (!user) { this.conversations = []; this.renderConversations(); return; }
    try { this.conversations = await DB.getConversations(user.id); this.renderConversations(); } catch (err) { console.error('Failed to load conversations:', err); }
  },
  render() { this.renderUser(Auth.getUser()); this.loadConversations(); },
  renderConversations() {
    const list = document.getElementById('conversation-list'); if (!list) return;
    if (this.conversations.length === 0) { list.innerHTML = `<div style="padding: var(--space-md); color: var(--text-muted); font-size: 0.85rem; text-align: center;">No conversations yet.<br>Start a new chat!</div>`; return; }
    list.innerHTML = this.conversations.map(conv => `<button class="sidebar-item ${conv.id === this.currentConversationId ? 'active' : ''}" data-conv-id="${conv.id}" onclick="Sidebar.selectConversation('${conv.id}')"><span class="sidebar-item-icon">\uD83D\uDCAC</span><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.escapeHtml(conv.title)}</span><span class="icon-btn" onclick="event.stopPropagation(); Sidebar.deleteConversation('${conv.id}')" style="opacity:0;transition:opacity 0.2s;" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=0">\uD83D\uDDD1\uFE0F</span></button>`).join('');
    list.querySelectorAll('.sidebar-item').forEach(item => { item.addEventListener('mouseenter', () => { const del = item.querySelector('.icon-btn'); if (del) del.style.opacity = '1'; }); item.addEventListener('mouseleave', () => { const del = item.querySelector('.icon-btn'); if (del) del.style.opacity = '0'; }); });
  },
  renderUser(user) {
    const container = document.getElementById('sidebar-user'); if (!container) return;
    if (!user) { container.innerHTML = `<a href="login.html" class="sidebar-user" style="text-decoration:none;"><div class="sidebar-user-avatar">\uD83D\uDC64</div><div class="sidebar-user-info"><div class="sidebar-user-name">Sign In</div><div class="sidebar-user-email">to save chats</div></div></a>`; return; }
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    container.innerHTML = `<div class="sidebar-user" id="user-menu-trigger"><div class="sidebar-user-avatar">${user.avatar ? `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : initials}</div><div class="sidebar-user-info"><div class="sidebar-user-name">${Utils.escapeHtml(user.name)}</div><div class="sidebar-user-email">${Utils.escapeHtml(user.email)}</div></div></div><div id="user-dropdown" style="display:none;position:absolute;bottom:100%;left:var(--space-md);right:var(--space-md);margin-bottom:var(--space-sm);background:var(--bg-glass-hover);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:var(--space-sm);box-shadow:var(--shadow-lg);z-index:200;"><a href="settings.html" class="sidebar-item" style="padding:var(--space-sm) var(--space-md);"><span class="sidebar-item-icon">\u2699\uFE0F</span> Settings</a><button class="sidebar-item" onclick="Auth.signOut().then(() => window.location.reload())" style="padding:var(--space-sm) var(--space-md);width:100%;"><span class="sidebar-item-icon">\uD83D\uDEAA</span> Sign Out</button></div>`;
    const trigger = document.getElementById('user-menu-trigger'); const dropdown = document.getElementById('user-dropdown');
    if (trigger && dropdown) { trigger.addEventListener('click', (e) => { e.stopPropagation(); dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none'; }); document.addEventListener('click', () => { dropdown.style.display = 'none'; }); }
  },
  async createNewChat() {
    const user = Auth.getUser(); const personalityId = Chat.currentPersonality?.id || 'general';
    try { const conv = await DB.createConversation(user?.id || 'guest', 'New Chat', personalityId); this.conversations.unshift(conv); this.currentConversationId = conv.id; this.renderConversations(); this.close(); if (window.Chat) Chat.loadConversation(conv.id); } catch (err) { Utils.toast('Failed to create conversation', 'error'); }
  },
  async selectConversation(id) { this.currentConversationId = id; this.renderConversations(); this.close(); if (window.Chat) Chat.loadConversation(id); },
  async deleteConversation(id) { if (!confirm('Delete this conversation?')) return; try { await DB.deleteConversation(id); this.conversations = this.conversations.filter(c => c.id !== id); if (this.currentConversationId === id) { this.currentConversationId = null; if (window.Chat) Chat.clearChat(); } this.renderConversations(); Utils.toast('Conversation deleted', 'success'); } catch (err) { Utils.toast('Failed to delete', 'error'); } },
  setActiveConversation(id) { this.currentConversationId = id; this.renderConversations(); },
};
window.Sidebar = Sidebar;
