"""RadiantWaves AI - FastAPI Backend"""
import os
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    personality: str = "general"
    conversation_id: Optional[str] = None
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str] = None

PERSONALITY_PROMPTS = {
    "general": "You are RadiantWaves AI, a helpful, creative, and precise assistant.",
    "news": "You are a professional news editor and journalist.",
    "writer": "You are an accomplished author and creative writer.",
    "business": "You are a seasoned business consultant and strategist.",
    "coder": "You are an expert software engineer.",
    "translator": "You are a professional translator fluent in dozens of languages.",
    "research": "You are a research analyst and academic expert.",
    "media": "You are a media production expert.",
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("RadiantWaves AI Backend starting...")
    yield
    print("Backend shutting down...")

app = FastAPI(title="RadiantWaves AI API", description="Backend for RadiantWaves AI", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
async def root():
    return {"name": "RadiantWaves AI", "version": "1.0.0", "status": "online", "personalities": list(PERSONALITY_PROMPTS.keys())}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not OPENAI_API_KEY:
        return ChatResponse(response=f"RadiantWaves AI is running in fallback mode.\n\nTo enable full AI responses, set your OPENAI_API_KEY environment variable.\n\nYour message: {request.message}\n\nSelected personality: {request.personality}", conversation_id=request.conversation_id)
    try:
        import openai
        client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
        system_prompt = PERSONALITY_PROMPTS.get(request.personality, PERSONALITY_PROMPTS["general"])
        messages = [{"role": "system", "content": system_prompt}]
        for msg in request.history: messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": request.message})
        response = await client.chat.completions.create(model="gpt-4o", messages=messages, temperature=0.7, max_tokens=2000)
        return ChatResponse(response=response.choices[0].message.content, conversation_id=request.conversation_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
