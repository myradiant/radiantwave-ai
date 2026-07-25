const App = {
  async init() {
    Utils.initTheme(); await DB.init(); await Auth.init();
    if (document.getElementById('sidebar')) Sidebar.init();
    if (document.getElementById('chat-messages')) Chat.init();
    if (document.getElementById('settings-page')) this.initSettings();
    if (document.getElementById('login-form')) this.initLogin();
    if (document.getElementById('register-form')) this.initRegister();
    this.bindGlobalEvents(); console.log('\uD83C\uDF0A RadiantWaves AI initialized');
  },
  bindGlobalEvents() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) { themeToggle.addEventListener('click', () => { const current = Utils.getTheme(); const next = current === 'dark' ? 'light' : 'dark'; Utils.setTheme(next); themeToggle.textContent = next === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'; }); themeToggle.textContent = Utils.getTheme() === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'; }
    document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); const input = document.getElementById('chat-input'); if (input) input.focus(); } if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') { e.preventDefault(); if (Sidebar.createNewChat) Sidebar.createNewChat(); } if (e.key === 'Escape') { if (Sidebar.close) Sidebar.close(); } });
  },
  initLogin() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => { e.preventDefault(); const email = document.getElementById('email').value; const password = document.getElementById('password').value; const submitBtn = form.querySelector('button[type="submit"]'); const originalText = submitBtn.textContent; submitBtn.disabled = true; submitBtn.textContent = 'Signing in...'; try { await Auth.signIn(email, password); Utils.toast('Welcome back!', 'success'); window.location.href = 'chat.html'; } catch (err) { Utils.toast(err.message || 'Sign in failed', 'error'); submitBtn.disabled = false; submitBtn.textContent = originalText; } });
  },
  initRegister() {
    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (e) => { e.preventDefault(); const name = document.getElementById('name').value; const email = document.getElementById('email').value; const password = document.getElementById('password').value; const confirm = document.getElementById('confirm-password').value; const submitBtn = form.querySelector('button[type="submit"]'); const originalText = submitBtn.textContent; if (password !== confirm) { Utils.toast('Passwords do not match', 'error'); return; } if (password.length < 6) { Utils.toast('Password must be at least 6 characters', 'error'); return; } submitBtn.disabled = true; submitBtn.textContent = 'Creating account...'; try { await Auth.signUp(email, password, name); Utils.toast('Account created! Welcome to RadiantWaves.', 'success'); window.location.href = 'chat.html'; } catch (err) { Utils.toast(err.message || 'Registration failed', 'error'); submitBtn.disabled = false; submitBtn.textContent = originalText; } });
  },
  initSettings() {
    const themeToggle = document.getElementById('settings-theme-toggle');
    if (themeToggle) { const toggle = themeToggle.querySelector('.toggle'); const isLight = Utils.getTheme() === 'light'; if (isLight) toggle.classList.add('active'); toggle.addEventListener('click', () => { toggle.classList.toggle('active'); const theme = toggle.classList.contains('active') ? 'light' : 'dark'; Utils.setTheme(theme); }); }
    const user = Auth.getUser(); if (user) { const nameEl = document.getElementById('settings-name'); const emailEl = document.getElementById('settings-email'); if (nameEl) nameEl.value = user.name || ''; if (emailEl) emailEl.value = user.email || ''; }
    const saveBtn = document.getElementById('save-profile-btn'); if (saveBtn) { saveBtn.addEventListener('click', async () => { const name = document.getElementById('settings-name')?.value; try { await Auth.updateProfile({ full_name: name, name }); Utils.toast('Profile updated', 'success'); } catch (err) { Utils.toast(err.message || 'Update failed', 'error'); } }); }
    const clearBtn = document.getElementById('clear-data-btn'); if (clearBtn) { clearBtn.addEventListener('click', () => { if (confirm('This will clear all local data. Continue?')) { Utils.storage.clear(); Utils.toast('All data cleared', 'info'); setTimeout(() => window.location.reload(), 1000); } }); }
  },
};
document.addEventListener('DOMContentLoaded', () => { App.init(); });
window.App = App;
