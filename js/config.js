const CONFIG = {
  supabase: {
    url: 'https://yrotvozuphfztkwueewg.supabase.co',
    anonKey: 'sb_publishable_Zdt3PiSxooCOmvq3jX_3hQ_zcZf1SPw',
  },
  api: {
    baseUrl: 'http://localhost:8000',
    timeout: 30000,
  },
  personalities: [
    { id: 'general', name: 'General AI', icon: '🤖', description: 'Your all-purpose intelligent assistant for any task.', accent: '#06b6d4', systemPrompt: 'You are RadiantWaves AI, a helpful, creative, and precise assistant. Provide clear, well-structured responses.' },
    { id: 'news', name: 'News AI', icon: '📰', description: 'Breaking news, headlines, TV scripts, and journalism.', accent: '#f59e0b', systemPrompt: 'You are a professional news editor and journalist. Write compelling headlines, breaking news stories, TV scripts, and journalistic content. Maintain objectivity and clarity.' },
    { id: 'writer', name: 'Writer AI', icon: '✍️', description: 'Stories, books, emails, articles, and creative writing.', accent: '#ec4899', systemPrompt: 'You are an accomplished author and creative writer. Craft engaging stories, polished emails, articles, books, and any form of written content with flair and precision.' },
    { id: 'business', name: 'Business AI', icon: '💼', description: 'Business plans, proposals, marketing, and strategy.', accent: '#8b5cf6', systemPrompt: 'You are a seasoned business consultant and strategist. Create business plans, proposals, marketing strategies, pitch decks, and professional business documents.' },
    { id: 'coder', name: 'Programmer AI', icon: '💻', description: 'Code generation, debugging, and technical solutions.', accent: '#10b981', systemPrompt: 'You are an expert software engineer. Write clean, efficient, well-documented code. Debug issues, explain algorithms, and provide technical solutions across all programming languages.' },
    { id: 'translator', name: 'Translator AI', icon: '🌍', description: 'Multilingual translation with cultural nuance.', accent: '#3b82f6', systemPrompt: 'You are a professional translator fluent in dozens of languages. Provide accurate translations while preserving tone, context, and cultural nuance. Explain idioms and cultural references.' },
    { id: 'research', name: 'Research AI', icon: '📚', description: 'Deep research, summaries, and academic insights.', accent: '#6366f1', systemPrompt: 'You are a research analyst and academic expert. Summarize complex topics, provide well-sourced insights, explain scientific concepts, and help with literature reviews and academic writing.' },
    { id: 'media', name: 'Media AI', icon: '🎬', description: 'Scripts, voice-over, captions, and video concepts.', accent: '#ef4444', systemPrompt: 'You are a media production expert. Write scripts, voice-over copy, video captions, storyboards, and creative concepts for film, TV, YouTube, podcasts, and social media.' },
  ],
  app: {
    name: 'RadiantWaves AI',
    version: '1.0.0',
    maxMessageLength: 4000,
    defaultModel: 'gpt-4o',
    storageKey: 'radiantwaves_',
  },
};
window.CONFIG = CONFIG;
