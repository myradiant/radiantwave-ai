const Utils = {
  toastContainer: null,
  initToastContainer() {
    if (!this.toastContainer) { this.toastContainer = document.createElement('div'); this.toastContainer.className = 'toast-container'; document.body.appendChild(this.toastContainer); }
  },
  toast(message, type = 'info', duration = 4000) {
    this.initToastContainer();
    const toast = document.createElement('div'); toast.className = `toast toast-${type}`;
    const icons = { success: '\u2713', error: '\u2715', info: '\u2139' };
    toast.innerHTML = `<span>${icons[type] || '\u2139'}</span><span>${message}</span>`;
    this.toastContainer.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = 'all 0.3s ease'; setTimeout(() => toast.remove(), 300); }, duration);
  },
  storage: {
    prefix: CONFIG.app.storageKey,
    get(key) { try { const d = localStorage.getItem(this.prefix + key); return d ? JSON.parse(d) : null; } catch { return null; } },
    set(key, value) { try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); } catch (e) { console.error('Storage error:', e); } },
    remove(key) { localStorage.removeItem(this.prefix + key); },
    clear() { Object.keys(localStorage).filter(k => k.startsWith(this.prefix)).forEach(k => localStorage.removeItem(k)); },
  },
  formatDate(date) {
    const d = new Date(date), now = new Date(), diff = now - d;
    const mins = Math.floor(diff / 60000), hrs = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now'; if (mins < 60) return `${mins}m ago`; if (hrs < 24) return `${hrs}h ago`; if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
  formatTime(date) { return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); },
  truncate(str, len = 50) { return str.length > len ? str.substring(0, len) + '...' : str; },
  escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; },
  renderMarkdown(text) {
    let html = this.escapeHtml(text);
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => `<div class="code-block"><pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre><button class="code-copy-btn" onclick="Utils.copyToClipboard(this)">Copy</button></div>`);
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>'); html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>'); html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>'); html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    html = html.split('\n\n').map(p => { p = p.trim(); if (!p) return ''; if (p.startsWith('<')) return p; return `<p>${p.replace(/\n/g, '<br>')}</p>`; }).join('');
    return html;
  },
  copyToClipboard(btn) { const code = btn.previousElementSibling.querySelector('code'); if (code) { navigator.clipboard.writeText(code.textContent).then(() => { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }); } },
  debounce(fn, delay = 300) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => fn(...args), delay); }; },
  generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); },
  getTheme() { return this.storage.get('theme') || 'dark'; },
  setTheme(theme) { document.documentElement.setAttribute('data-theme', theme); this.storage.set('theme', theme); },
  initTheme() { this.setTheme(this.getTheme()); },
};
window.Utils = Utils;
