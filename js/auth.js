const Auth = {
  currentUser: null, authListeners: [],
  async init() {
    if (DB.isConnected() && supabaseClient) {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user) this.currentUser = this._formatUser(session.user);
      supabaseClient.auth.onAuthStateChange((_event, session) => { this.currentUser = session?.user ? this._formatUser(session.user) : null; this._notifyListeners(); });
    } else { this.currentUser = Utils.storage.get('user'); }
  },
  _formatUser(supabaseUser) { return { id: supabaseUser.id, email: supabaseUser.email, name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User', avatar: supabaseUser.user_metadata?.avatar_url || null }; },
  _notifyListeners() { this.authListeners.forEach(cb => cb(this.currentUser)); },
  onAuthChange(callback) { this.authListeners.push(callback); callback(this.currentUser); },
  getUser() { return this.currentUser; },
  isLoggedIn() { return !!this.currentUser; },
  async signUp(email, password, name) {
    if (DB.isConnected() && supabaseClient) { const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name } } }); if (error) throw error; return data; }
    const users = Utils.storage.get('users') || []; if (users.find(u => u.email === email)) throw new Error('Email already registered');
    const user = { id: Utils.generateId(), email, password, name, created_at: new Date().toISOString() }; users.push(user); Utils.storage.set('users', users);
    this.currentUser = { id: user.id, email: user.email, name: user.name, avatar: null }; Utils.storage.set('user', this.currentUser); this._notifyListeners(); return { user: this.currentUser };
  },
  async signIn(email, password) {
    if (DB.isConnected() && supabaseClient) { const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) throw error; this.currentUser = this._formatUser(data.user); this._notifyListeners(); return data; }
    const users = Utils.storage.get('users') || []; const user = users.find(u => u.email === email && u.password === password); if (!user) throw new Error('Invalid email or password');
    this.currentUser = { id: user.id, email: user.email, name: user.name, avatar: null }; Utils.storage.set('user', this.currentUser); this._notifyListeners(); return { user: this.currentUser };
  },
  async signOut() { if (DB.isConnected() && supabaseClient) await supabaseClient.auth.signOut(); this.currentUser = null; Utils.storage.remove('user'); this._notifyListeners(); },
  async signInWithOAuth(provider) { if (!DB.isConnected() || !supabaseClient) throw new Error('OAuth requires Supabase connection'); const { data, error } = await supabaseClient.auth.signInWithOAuth({ provider, options: { redirectTo:'https://github.com/myradiant/radiantwave-ai' } }); if (error) throw error; return data; },
  async updateProfile(updates) {
    if (DB.isConnected() && supabaseClient) { const { data, error } = await supabaseClient.auth.updateUser({ data: updates }); if (error) throw error; this.currentUser = this._formatUser(data.user); this._notifyListeners(); return data; }
    if (this.currentUser) { this.currentUser = { ...this.currentUser, ...updates }; Utils.storage.set('user', this.currentUser); const users = Utils.storage.get('users') || []; const idx = users.findIndex(u => u.id === this.currentUser.id); if (idx >= 0) { users[idx] = { ...users[idx], ...updates }; Utils.storage.set('users', users); } this._notifyListeners(); }
  },
};
window.Auth = Auth;
