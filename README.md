# RadiantWaves AI

**8 Specialized AI Assistants. One Beautiful Interface.**

RadiantWaves AI is a production-ready AI chat platform with specialized personalities for writing, coding, business, news, research, translation, and media production.

## Features

- **8 AI Personalities**: General, News, Writer, Business, Programmer, Translator, Research, Media
- **Real-time Chat**: Kimi/ChatGPT-style interface
- **Dark/Light Mode**: Toggle with one click
- **Fully Responsive**: Desktop, tablet, and mobile
- **Authentication**: Email/password + Google OAuth via Supabase
- **Conversation History**: Persistent chats with Supabase or local fallback
- **FastAPI Backend**: Python backend with OpenAI integration

## Quick Start

### 1. Frontend
```bash
python -m http.server 5500
# Open http://localhost:5500
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt

# Create .env
echo "OPENAI_API_KEY=sk-your-key" > .env

python main.py
# -> http://localhost:8000
```

### 3. Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. SQL Editor -> paste `supabase/schema.sql`
3. Copy Project URL and anon key to `js/config.js`

## Project Structure

```
radiantwaves-ai/
├── index.html          # Landing page
├── chat.html           # Chat interface
├── login.html          # Sign in
├── register.html       # Sign up
├── settings.html       # User settings
├── css/
│   └── main.css        # Design system
├── js/
│   ├── config.js       # Config + personalities
│   ├── utils.js        # Utilities
│   ├── db.js           # Database layer
│   ├── auth.js         # Authentication
│   ├── sidebar.js      # Sidebar
│   ├── chat.js         # Chat engine
│   └── app.js          # Bootstrap
├── backend/
│   └── main.py         # FastAPI server
├── supabase/
│   └── schema.sql      # DB schema
├── requirements.txt
└── README.md
```

## Tech Stack

- **Frontend**: Vanilla JS, CSS Variables, Glassmorphism
- **Backend**: FastAPI, Python 3.10+
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI GPT-4o

## License

MIT - Built with passion.
