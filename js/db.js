let supabaseClient = null;

const DB = {
  async init() {
    if (typeof supabase === 'undefined') {
      console.warn('Supabase library not loaded. Using local fallback.');
      return false;
    }
    try {
      supabaseClient = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
      const { error } = await supabaseClient.from('conversations').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') throw error;
      console.log('Supabase connected');
      return true;
    } catch (err) {
      console.warn('Supabase failed, using local storage:', err.message);
      return false;
    }
  },

  isConnected() {
    return supabaseClient !== null;
  },

  async getConversations(userId) {
    if (!this.isConnected()) return this._localGetConversations(userId);
    const { data, error } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // FIXED: use created_at instead of updated_at
    if (error) {
      console.error('getConversations error:', error);
      throw error;
    }
    return data || [];
  },

  async createConversation(userId, title, personalityId) {
    const now = new Date().toISOString();
    const conv = {
      id: Utils.generateId(),
      user_id: userId,
      title: title || 'New Chat',
      personality_id: personalityId || 'general',
      created_at: now,
      updated_at: now
    };

    if (!this.isConnected()) {
      const convs = Utils.storage.get('conversations') || [];
      convs.unshift(conv);
      Utils.storage.set('conversations', convs);
      return conv;
    }

    const { data, error } = await supabaseClient
      .from('conversations')
      .insert(conv)
      .select()
      .single();

    if (error) {
      console.error('createConversation error:', error);
      throw error;
    }
    return data;
  },

  async updateConversation(id, updates) {
    updates.updated_at = new Date().toISOString();

    if (!this.isConnected()) {
      const convs = Utils.storage.get('conversations') || [];
      const idx = convs.findIndex(c => c.id === id);
      if (idx >= 0) {
        convs[idx] = { ...convs[idx], ...updates };
        Utils.storage.set('conversations', convs);
      }
      return convs[idx];
    }

    const { data, error } = await supabaseClient
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('updateConversation error:', error);
      throw error;
    }
    return data;
  },

  async deleteConversation(id) {
    if (!this.isConnected()) {
      let convs = Utils.storage.get('conversations') || [];
      convs = convs.filter(c => c.id !== id);
      Utils.storage.set('conversations', convs);
      let msgs = Utils.storage.get('messages') || {};
      delete msgs[id];
      Utils.storage.set('messages', msgs);
      return;
    }

    await supabaseClient.from('messages').delete().eq('conversation_id', id);
    await supabaseClient.from('conversations').delete().eq('id', id);
  },

  async getMessages(conversationId) {
    if (!this.isConnected()) return this._localGetMessages(conversationId);

    const { data, error } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getMessages error:', error);
      throw error;
    }
    return data || [];
  },

  async saveMessage(conversationId, role, content, personalityId) {
    const msg = {
      id: Utils.generateId(),
      conversation_id: conversationId,
      role,
      content,
      personality_id: personalityId || 'general',
      created_at: new Date().toISOString()
    };

    if (!this.isConnected()) {
      const msgs = Utils.storage.get('messages') || {};
      if (!msgs[conversationId]) msgs[conversationId] = [];
      msgs[conversationId].push(msg);
      Utils.storage.set('messages', msgs);
      return msg;
    }

    const { data, error } = await supabaseClient
      .from('messages')
      .insert(msg)
      .select()
      .single();

    if (error) {
      console.error('saveMessage error:', error);
      throw error;
    }
    return data;
  },

  _localGetConversations(userId) {
    const convs = Utils.storage.get('conversations') || [];
    return convs.filter(c => c.user_id === userId);
  },

  _localGetMessages(conversationId) {
    const msgs = Utils.storage.get('messages') || {};
    return msgs[conversationId] || [];
  }
};

window.DB = DB;
